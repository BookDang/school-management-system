import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import type { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('me', () => {
    const currentUser: AuthenticatedUser = { id: '1', email: 'jane@example.com' };

    it('returns the public profile of the current user', async () => {
      const user = { id: '1', email: 'jane@example.com', fullName: 'Jane Doe' } as User;
      usersService.findById.mockResolvedValue(user);

      const result = await controller.me(currentUser);

      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: '1', email: 'jane@example.com', fullName: 'Jane Doe' });
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(controller.me(currentUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
