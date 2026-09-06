import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  type PolicyHandlerCallback,
} from '@/modules/authorization/check-policies.decorator';
import { Role } from '@/modules/users/entities/role.enum';
import { CenterClassesController } from './center-classes.controller';
import { CenterClassesService } from './center-classes.service';
import { Classes } from './entities/classes.entity';

describe('CenterClassesController', () => {
  let controller: CenterClassesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findEntityById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const teacher: AuthenticatedUser = {
    id: 'teacher-1',
    email: 'teacher@example.com',
    role: Role.Teacher,
  };
  const otherTeacher: AuthenticatedUser = {
    id: 'teacher-2',
    email: 'other@example.com',
    role: Role.Teacher,
  };
  const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@example.com', role: Role.Admin };
  const student: AuthenticatedUser = {
    id: 'student-1',
    email: 'student@example.com',
    role: Role.Student,
  };
  const classEntity = Object.assign(new Classes(), {
    id: 'class-1',
    name: 'IELTS Foundation',
    teacherId: teacher.id,
    capacity: 15,
  });
  const view = {
    id: 'class-1',
    name: 'IELTS Foundation',
    teacherId: teacher.id,
    capacity: 15,
    subject: 'English',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findEntityById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CenterClassesController],
      providers: [{ provide: CenterClassesService, useValue: service }, CaslAbilityFactory],
    }).compile();

    controller = module.get<CenterClassesController>(CenterClassesController);
  });

  describe('create', () => {
    it('delegates to the service', async () => {
      const dto = {
        name: 'IELTS Foundation',
        teacherId: teacher.id,
        capacity: 15,
        subject: 'English',
      };
      service.create.mockResolvedValue(view);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(view);
    });
  });

  describe('findAll', () => {
    it('delegates to the service', async () => {
      service.findAll.mockResolvedValue([view]);

      const result = await controller.findAll();

      expect(result).toEqual([view]);
    });
  });

  describe('findOne', () => {
    it('returns the class when it exists', async () => {
      service.findById.mockResolvedValue(view);

      const result = await controller.findOne('class-1');

      expect(result).toBe(view);
    });

    it('throws NotFoundException when it does not exist', async () => {
      service.findById.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('allows a teacher to update their own class', async () => {
      service.findEntityById.mockResolvedValue(classEntity);
      service.update.mockResolvedValue({ ...view, capacity: 20 });

      const result = await controller.update('class-1', { capacity: 20 }, teacher);

      expect(service.update).toHaveBeenCalledWith('class-1', { capacity: 20 });
      expect(result).toEqual({ ...view, capacity: 20 });
    });

    it("rejects a teacher updating another teacher's class", async () => {
      service.findEntityById.mockResolvedValue(classEntity);

      await expect(
        controller.update('class-1', { capacity: 20 }, otherTeacher),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('allows an admin to update any class', async () => {
      service.findEntityById.mockResolvedValue(classEntity);
      service.update.mockResolvedValue({ ...view, capacity: 20 });

      await controller.update('class-1', { capacity: 20 }, admin);

      expect(service.update).toHaveBeenCalledWith('class-1', { capacity: 20 });
    });

    it('throws NotFoundException when the class does not exist', async () => {
      service.findEntityById.mockResolvedValue(null);

      await expect(controller.update('missing', { capacity: 20 }, teacher)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('delegates to the service', async () => {
      await controller.remove('class-1');

      expect(service.remove).toHaveBeenCalledWith('class-1');
    });
  });

  describe('policy handlers', () => {
    const caslAbilityFactory = new CaslAbilityFactory();
    const adminAbility = caslAbilityFactory.createForUser(admin);
    const teacherAbility = caslAbilityFactory.createForUser(teacher);
    const studentAbility = caslAbilityFactory.createForUser(student);

    const getHandlers = (method: (...args: never[]) => unknown): PolicyHandlerCallback[] =>
      Reflect.getMetadata(CHECK_POLICIES_KEY, method) ?? [];

    it('requires Create on Classes (admin only)', () => {
      const [handler] = getHandlers(CenterClassesController.prototype.create);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(false);
      expect(handler(studentAbility)).toBe(false);
    });

    it('requires Read on Classes for findAll and findOne (everyone)', () => {
      const [findAllHandler] = getHandlers(CenterClassesController.prototype.findAll);
      const [findOneHandler] = getHandlers(CenterClassesController.prototype.findOne);

      for (const handler of [findAllHandler, findOneHandler]) {
        expect(handler(adminAbility)).toBe(true);
        expect(handler(teacherAbility)).toBe(true);
        expect(handler(studentAbility)).toBe(true);
      }
    });

    it('requires some Update rule on Classes for update (student has none)', () => {
      const [handler] = getHandlers(CenterClassesController.prototype.update);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(true);
      expect(handler(studentAbility)).toBe(false);
    });

    it('requires Delete on Classes (admin only)', () => {
      const [handler] = getHandlers(CenterClassesController.prototype.remove);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(false);
      expect(handler(studentAbility)).toBe(false);
    });
  });
});
