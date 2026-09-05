import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { Role } from '@/modules/users/entities/role.enum';
import { AuthService } from './auth.service';
import { StaffAuthController } from './staff-auth.controller';

describe('StaffAuthController', () => {
  let controller: StaffAuthController;
  let authService: {
    registerStaff: jest.Mock;
    loginStaff: jest.Mock;
    refreshStaff: jest.Mock;
    logout: jest.Mock;
    getRefreshCookieMaxAge: jest.Mock;
  };
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(async () => {
    authService = {
      registerStaff: jest.fn(),
      loginStaff: jest.fn(),
      refreshStaff: jest.fn(),
      logout: jest.fn(),
      getRefreshCookieMaxAge: jest.fn().mockReturnValue(604800000),
    };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffAuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        Reflector,
        CaslAbilityFactory,
        PoliciesGuard,
      ],
    }).compile();

    controller = module.get<StaffAuthController>(StaffAuthController);
  });

  it('delegates register to AuthService.registerStaff', async () => {
    const dto = {
      email: 'newadmin@example.com',
      password: 'password123',
      fullName: 'New Admin',
      role: Role.Admin,
    };
    const expected = { id: '2', email: dto.email, fullName: dto.fullName, role: Role.Admin };
    authService.registerStaff.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(authService.registerStaff).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('logs in and sets the staff refresh cookie', async () => {
    const dto = { email: 'admin@example.com', password: 'password123' };
    authService.loginStaff.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: '1', email: dto.email, fullName: 'Admin', role: Role.Admin },
    });

    const result = await controller.login(dto, res as never);

    expect(authService.loginStaff).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      'staff_refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(result.accessToken).toBe('access-token');
  });

  it('refreshes using the staff cookie from the request and rotates it', async () => {
    const req = { cookies: { staff_refresh_token: 'old-refresh-token' } };
    authService.refreshStaff.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: { id: '1', email: 'admin@example.com', fullName: 'Admin', role: Role.Admin },
    });

    const result = await controller.refresh(req as never, res as never);

    expect(authService.refreshStaff).toHaveBeenCalledWith('old-refresh-token');
    expect(res.cookie).toHaveBeenCalledWith(
      'staff_refresh_token',
      'new-refresh-token',
      expect.any(Object),
    );
    expect(result.accessToken).toBe('new-access-token');
  });

  it('rejects refresh when there is no staff cookie', async () => {
    const req = { cookies: {} };

    await expect(controller.refresh(req as never, res as never)).rejects.toThrow(
      'Missing refresh token',
    );
    expect(authService.refreshStaff).not.toHaveBeenCalled();
  });

  it('logs out using the current user id and clears the staff cookie', async () => {
    const currentUser = { id: '1', email: 'admin@example.com', role: Role.Admin };

    await controller.logout(currentUser, res as never);

    expect(authService.logout).toHaveBeenCalledWith('1');
    expect(res.clearCookie).toHaveBeenCalledWith('staff_refresh_token', { path: '/' });
  });
});
