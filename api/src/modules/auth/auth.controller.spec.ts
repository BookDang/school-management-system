import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@/modules/users/entities/role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    getRefreshCookieMaxAge: jest.Mock;
  };
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getRefreshCookieMaxAge: jest.fn().mockReturnValue(604800000),
    };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('registers, sets the refresh cookie, and omits refreshToken from the response body', async () => {
    const dto = { email: 'jane@example.com', password: 'password123', fullName: 'Jane Doe' };
    authService.register.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '1', email: dto.email, fullName: dto.fullName, role: Role.Student },
    });

    const result = await controller.register(dto, res as never);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      user: { id: '1', email: dto.email, fullName: dto.fullName, role: Role.Student },
    });
    expect((result as Record<string, unknown>).refreshToken).toBeUndefined();
  });

  it('logs in and sets the refresh cookie', async () => {
    const dto = { email: 'jane@example.com', password: 'password123' };
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '1', email: dto.email, fullName: 'Jane Doe', role: Role.Student },
    });

    const result = await controller.login(dto, res as never);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.any(Object));
    expect(result.accessToken).toBe('access-token');
  });

  it('refreshes using the cookie from the request and rotates it', async () => {
    const req = { cookies: { refresh_token: 'old-refresh-token' } };
    authService.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Student },
    });

    const result = await controller.refresh(req as never, res as never);

    expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.any(Object),
    );
    expect(result.accessToken).toBe('new-access-token');
  });

  it('rejects refresh when there is no cookie', async () => {
    const req = { cookies: {} };

    await expect(controller.refresh(req as never, res as never)).rejects.toThrow(
      'Missing refresh token',
    );
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('logs out using the current user id and clears the cookie', async () => {
    const currentUser = { id: '1', email: 'jane@example.com', role: Role.Student };

    await controller.logout(currentUser, res as never);

    expect(authService.logout).toHaveBeenCalledWith('1');
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
  });
});
