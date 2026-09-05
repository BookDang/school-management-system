import { createHash, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import ms, { type StringValue } from 'ms';
import { type PublicUser, toPublicUser } from '@/modules/users/dto/public-user.dto';
import { Role } from '@/modules/users/entities/role.enum';
import type { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { RegisterStaffDto } from './dto/register-staff.dto';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

interface RefreshPayload {
  sub: string;
}

const SALT_ROUNDS = 10;
const STAFF_ROLES = [Role.Admin, Role.Teacher];
const END_USER_ROLES = [Role.Student];

/**
 * bcrypt truncates its input at 72 bytes. JWTs for the same user share a long common prefix
 * (constant header + the same `sub` claim), so hashing the raw token with bcrypt would make
 * every refresh token for a given user collide. Hash with SHA-256 first — a fixed-length,
 * collision-resistant digest — before storing/comparing.
 */
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
    });

    return this.buildAuthResult(user);
  }

  /** Only an existing admin can call this (see StaffAuthController) — not public self-service. */
  async registerStaff(dto: RegisterStaffDto): Promise<PublicUser> {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      role: dto.role,
    });

    return toPublicUser(user);
  }

  /** For end users of the system (students). */
  login(dto: LoginDto): Promise<AuthResult> {
    return this.authenticate(dto, END_USER_ROLES);
  }

  /** For center staff (admins/teachers) — a separate portal from the end-user login. */
  loginStaff(dto: LoginDto): Promise<AuthResult> {
    return this.authenticate(dto, STAFF_ROLES);
  }

  refresh(refreshToken: string): Promise<AuthResult> {
    return this.rotateRefreshToken(refreshToken, END_USER_ROLES);
  }

  refreshStaff(refreshToken: string): Promise<AuthResult> {
    return this.rotateRefreshToken(refreshToken, STAFF_ROLES);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  /** How long the refresh-token cookie should live — mirrors the token's own JWT expiry. */
  getRefreshCookieMaxAge(): number {
    return ms(this.refreshExpiresIn());
  }

  private async authenticate(dto: LoginDto, allowedRoles: Role[]): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = user ? await bcrypt.compare(dto.password, user.password) : false;

    if (!user || !isPasswordValid || !allowedRoles.includes(user.role)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user);
  }

  private async rotateRefreshToken(
    refreshToken: string,
    allowedRoles: Role[],
  ): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = payload ? await this.usersService.findById(payload.sub) : null;

    const isRefreshTokenValid =
      user?.hashedRefreshToken != null &&
      user.hashedRefreshToken === hashRefreshToken(refreshToken);

    if (!user || !isRefreshTokenValid || !allowedRoles.includes(user.role)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResult(user);
  }

  private async verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
    try {
      return await this.jwtService.verifyAsync<RefreshPayload>(token, {
        secret: this.refreshSecret(),
      });
    } catch {
      return null;
    }
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: randomUUID() },
      { secret: this.refreshSecret(), expiresIn: this.refreshExpiresIn() },
    );

    await this.usersService.setRefreshToken(user.id, hashRefreshToken(refreshToken));

    return { accessToken, refreshToken, user: toPublicUser(user) };
  }

  private refreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me');
  }

  private refreshExpiresIn(): StringValue {
    return this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d');
  }
}
