import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { Action } from '@/modules/authorization/actions.enum';
import { CheckPolicies } from '@/modules/authorization/check-policies.decorator';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { PublicUser, toPublicUser } from './dto/public-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: PublicUser })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(user);
  }

  @ApiOperation({ summary: 'List all users (admin-only)' })
  @ApiOkResponse({ type: PublicUser, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Caller is not an admin.' })
  @Get()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(toPublicUser);
  }
}
