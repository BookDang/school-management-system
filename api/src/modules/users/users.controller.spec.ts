import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { Role } from './entities/role.enum';
import type { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findById: jest.Mock; findAll: jest.Mock };

  beforeEach(async () => {
    usersService = { findById: jest.fn(), findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        Reflector,
        CaslAbilityFactory,
        PoliciesGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('me', () => {
    const currentUser: AuthenticatedUser = {
      id: '1',
      email: 'jane@example.com',
      role: Role.Student,
    };

    it('returns the public profile of the current user', async () => {
      const user = {
        id: '1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: Role.Student,
      } as User;
      usersService.findById.mockResolvedValue(user);

      const result = await controller.me(currentUser);

      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        id: '1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: Role.Student,
      });
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(controller.me(currentUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns the public profile of every user', async () => {
      const users = [
        { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Admin },
        { id: '2', email: 'joe@example.com', fullName: 'Joe Doe', role: Role.Student },
      ] as User[];
      usersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual([
        { id: '1', email: 'jane@example.com', fullName: 'Jane Doe', role: Role.Admin },
        { id: '2', email: 'joe@example.com', fullName: 'Joe Doe', role: Role.Student },
      ]);
    });
  });
});
