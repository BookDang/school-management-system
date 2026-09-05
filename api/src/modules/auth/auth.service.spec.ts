import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Role } from '@/modules/users/entities/role.enum';
import { UsersService } from '@/modules/users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { create: jest.Mock; findByEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = { create: jest.fn(), findByEmail: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes the password, creates the user and returns a token', async () => {
      usersService.create.mockImplementation((input) =>
        Promise.resolve({ id: '1', role: Role.Student, ...input }),
      );

      const result = await service.register({
        email: 'jane@example.com',
        password: 'password123',
        fullName: 'Jane Doe',
      });

      const [createInput] = usersService.create.mock.calls[0];
      expect(createInput.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', createInput.password)).toBe(true);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'jane@example.com',
        role: Role.Student,
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Student },
      });
    });
  });

  describe('login', () => {
    it('returns a token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'jane@example.com',
        password: hashedPassword,
        fullName: 'Jane Doe',
        role: Role.Admin,
      });

      const result = await service.login({ email: 'jane@example.com', password: 'password123' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'jane@example.com',
        role: Role.Admin,
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Admin },
      });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'jane@example.com',
        password: hashedPassword,
        fullName: 'Jane Doe',
        role: Role.Student,
      });

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
