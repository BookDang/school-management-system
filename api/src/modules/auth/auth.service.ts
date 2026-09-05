import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { type PublicUser, toPublicUser } from '@/modules/users/dto/public-user.dto';
import type { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = user ? await bcrypt.compare(dto.password, user.password) : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: User): AuthResult {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user: toPublicUser(user) };
  }
}
