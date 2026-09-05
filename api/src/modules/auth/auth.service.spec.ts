import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Role } from '@/modules/users/entities/role.enum';
import { UsersService } from '@/modules/users/users.service';
import { AuthService, hashRefreshToken } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
    setRefreshToken: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };

  const mockUser = async (role: Role, overrides: Record<string, unknown> = {}) => ({
    id: '1',
    email: 'jane@example.com',
    password: await bcrypt.hash('password123', 10),
    fullName: 'Jane Doe',
    role,
    hashedRefreshToken: null,
    ...overrides,
  });

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      setRefreshToken: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn((_key, fallback) => fallback) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes the password, creates the user, and returns tokens', async () => {
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
      expect(usersService.setRefreshToken).toHaveBeenCalledWith('1', expect.any(String));
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
        user: { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Student },
      });
    });
  });

  describe('registerStaff', () => {
    it('creates a staff user with the given role and returns no token', async () => {
      usersService.create.mockImplementation((input) => Promise.resolve({ id: '2', ...input }));

      const result = await service.registerStaff({
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin',
        role: Role.Admin,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@example.com', role: Role.Admin }),
      );
      expect(result).toEqual({
        id: '2',
        email: 'admin@example.com',
        fullName: 'Admin',
        role: Role.Admin,
      });
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login (end users)', () => {
    it('returns tokens for a student with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Student));

      const result = await service.login({ email: 'jane@example.com', password: 'password123' });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });

    it('rejects an admin trying to use the end-user login', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Admin));

      await expect(
        service.login({ email: 'jane@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Student));

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('loginStaff', () => {
    it('returns tokens for an admin with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Admin));

      const result = await service.loginStaff({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed-token');
    });

    it('returns tokens for a teacher with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Teacher));

      const result = await service.loginStaff({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed-token');
    });

    it('rejects a student trying to use the staff login', async () => {
      usersService.findByEmail.mockResolvedValue(await mockUser(Role.Student));

      await expect(
        service.loginStaff({ email: 'jane@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh (end users)', () => {
    it('rotates tokens for a valid refresh token belonging to a student', async () => {
      const hashedRefreshToken = hashRefreshToken('valid-refresh-token');
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      usersService.findById.mockResolvedValue(await mockUser(Role.Student, { hashedRefreshToken }));

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('signed-token');
      expect(usersService.setRefreshToken).toHaveBeenCalledWith('1', expect.any(String));
    });

    it('rejects when the token fails verification', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(service.refresh('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects when the token doesn't match the stored hash (already rotated/revoked)", async () => {
      const hashedRefreshToken = hashRefreshToken('a-different-token');
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      usersService.findById.mockResolvedValue(await mockUser(Role.Student, { hashedRefreshToken }));

      await expect(service.refresh('valid-refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a staff refresh token on the end-user refresh endpoint', async () => {
      const hashedRefreshToken = hashRefreshToken('valid-refresh-token');
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      usersService.findById.mockResolvedValue(await mockUser(Role.Admin, { hashedRefreshToken }));

      await expect(service.refresh('valid-refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      await service.logout('1');

      expect(usersService.setRefreshToken).toHaveBeenCalledWith('1', null);
    });
  });

  describe('getRefreshCookieMaxAge', () => {
    it('converts the configured JWT_REFRESH_EXPIRES_IN duration to milliseconds', () => {
      expect(service.getRefreshCookieMaxAge()).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('hashRefreshToken', () => {
    it('produces different hashes for two JWTs sharing the same long prefix', () => {
      // Regression test: two refresh tokens for the same user share a long common prefix
      // (constant JWT header + identical `sub` claim). bcrypt truncates its input at 72
      // bytes, so hashing the raw token with bcrypt made every token for that user collide.
      const commonPrefix = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYW1lLXVzZXItaWQtc2FtZS11c2VyLWlk';
      const tokenA = `${commonPrefix}LWEiLCJqdGkiOiJhIn0.sigA`;
      const tokenB = `${commonPrefix}LWIiLCJqdGkiOiJiIn0.sigB`;

      expect(hashRefreshToken(tokenA)).not.toBe(hashRefreshToken(tokenB));
    });
  });
});
