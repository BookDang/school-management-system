import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { STAFF_REFRESH_COOKIE_NAME as REFRESH_COOKIE_NAME } from '@/constants/auth-cookies.constant';
import { clearRefreshCookie, setRefreshCookie } from '@/helpers/refresh-cookie.helper';
import { Action } from '@/modules/authorization/actions.enum';
import { CheckPolicies } from '@/modules/authorization/check-policies.decorator';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { PublicUser } from '@/modules/users/dto/public-user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

/** Authentication for center staff (admins/teachers) — a separate portal from AuthController. */
@ApiTags('Staff Auth')
@Controller('auth/staff')
export class StaffAuthController {
  constructor(private readonly authService: AuthService) {}

  /** Only an admin can provision another staff account — there is no public self-service signup. */
  @ApiOperation({ summary: 'Provision a new staff account (admin-only)' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PublicUser })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Caller is not an admin.' })
  @Post('register')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  register(@Body() dto: RegisterStaffDto) {
    return this.authService.registerStaff(dto);
  }

  @ApiOperation({
    summary: 'Log in as staff (admin/teacher)',
    description: 'Also sets the `staff_refresh_token` httpOnly cookie.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.loginStaff(dto);
    this.setCookie(res, refreshToken);
    return { accessToken, user };
  }

  @ApiOperation({
    summary: 'Rotate the staff refresh token',
    description: 'Reads the `staff_refresh_token` httpOnly cookie and issues a new token pair.',
  })
  @ApiCookieAuth('staff_refresh_token')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid refresh token.' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.refreshStaff(refreshToken);
    this.setCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @ApiOperation({
    summary: 'Log out',
    description: 'Clears the refresh session and the `staff_refresh_token` cookie.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Logged out successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(currentUser.id);
    clearRefreshCookie(res, REFRESH_COOKIE_NAME);
  }

  private setCookie(res: Response, refreshToken: string) {
    setRefreshCookie(
      res,
      REFRESH_COOKIE_NAME,
      refreshToken,
      this.authService.getRefreshCookieMaxAge(),
    );
  }
}
