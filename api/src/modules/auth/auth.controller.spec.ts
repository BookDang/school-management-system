import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates register to AuthService', async () => {
    const dto = { email: 'jane@example.com', password: 'password123', fullName: 'Jane Doe' };
    const expected = { accessToken: 'token', user: { id: '1', ...dto } };
    authService.register.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'jane@example.com', password: 'password123' };
    const expected = {
      accessToken: 'token',
      user: { id: '1', email: dto.email, fullName: 'Jane Doe' },
    };
    authService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });
});
