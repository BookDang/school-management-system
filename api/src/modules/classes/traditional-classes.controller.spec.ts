import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  type PolicyHandlerCallback,
} from '@/modules/authorization/check-policies.decorator';
import { Role } from '@/modules/users/entities/role.enum';
import { Classes } from './entities/classes.entity';
import { TraditionalClassesController } from './traditional-classes.controller';
import { TraditionalClassesService } from './traditional-classes.service';

describe('TraditionalClassesController', () => {
  let controller: TraditionalClassesController;
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
  // A real Classes instance - CaslAbilityFactory's detectSubjectType resolves a checked value by
  // its constructor, so it only matches Classes-scoped rules with the real prototype in place.
  const classEntity = Object.assign(new Classes(), {
    id: 'class-1',
    name: '10A1',
    teacherId: teacher.id,
    capacity: 30,
  });
  const view = {
    id: 'class-1',
    name: '10A1',
    teacherId: teacher.id,
    capacity: 30,
    gradeLevel: '10',
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
      controllers: [TraditionalClassesController],
      providers: [{ provide: TraditionalClassesService, useValue: service }, CaslAbilityFactory],
    }).compile();

    controller = module.get<TraditionalClassesController>(TraditionalClassesController);
  });

  describe('create', () => {
    it('delegates to the service', async () => {
      const dto = { name: '10A1', teacherId: teacher.id, capacity: 30, gradeLevel: '10' };
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
      service.update.mockResolvedValue({ ...view, capacity: 25 });

      const result = await controller.update('class-1', { capacity: 25 }, teacher);

      expect(service.update).toHaveBeenCalledWith('class-1', { capacity: 25 });
      expect(result).toEqual({ ...view, capacity: 25 });
    });

    it("rejects a teacher updating another teacher's class", async () => {
      service.findEntityById.mockResolvedValue(classEntity);

      await expect(
        controller.update('class-1', { capacity: 25 }, otherTeacher),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('allows an admin to update any class', async () => {
      service.findEntityById.mockResolvedValue(classEntity);
      service.update.mockResolvedValue({ ...view, capacity: 25 });

      await controller.update('class-1', { capacity: 25 }, admin);

      expect(service.update).toHaveBeenCalledWith('class-1', { capacity: 25 });
    });

    it('throws NotFoundException when the class does not exist', async () => {
      service.findEntityById.mockResolvedValue(null);

      await expect(controller.update('missing', { capacity: 25 }, teacher)).rejects.toBeInstanceOf(
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

  // @CheckPolicies handlers only run through PoliciesGuard on a real HTTP request (see
  // classes.e2e-spec.ts) - calling controller methods directly, as above, never invokes them.
  // Exercised directly here against real abilities to verify each route requires the correct
  // Action/Classes rule.
  describe('policy handlers', () => {
    const caslAbilityFactory = new CaslAbilityFactory();
    const adminAbility = caslAbilityFactory.createForUser(admin);
    const teacherAbility = caslAbilityFactory.createForUser(teacher);
    const studentAbility = caslAbilityFactory.createForUser(student);

    const getHandlers = (method: (...args: never[]) => unknown): PolicyHandlerCallback[] =>
      Reflect.getMetadata(CHECK_POLICIES_KEY, method) ?? [];

    it('requires Create on Classes (admin only)', () => {
      const [handler] = getHandlers(TraditionalClassesController.prototype.create);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(false);
      expect(handler(studentAbility)).toBe(false);
    });

    it('requires Read on Classes for findAll and findOne (everyone)', () => {
      const [findAllHandler] = getHandlers(TraditionalClassesController.prototype.findAll);
      const [findOneHandler] = getHandlers(TraditionalClassesController.prototype.findOne);

      for (const handler of [findAllHandler, findOneHandler]) {
        expect(handler(adminAbility)).toBe(true);
        expect(handler(teacherAbility)).toBe(true);
        expect(handler(studentAbility)).toBe(true);
      }
    });

    it('requires some Update rule on Classes for update (student has none)', () => {
      const [handler] = getHandlers(TraditionalClassesController.prototype.update);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(true);
      expect(handler(studentAbility)).toBe(false);
    });

    it('requires Delete on Classes (admin only)', () => {
      const [handler] = getHandlers(TraditionalClassesController.prototype.remove);

      expect(handler(adminAbility)).toBe(true);
      expect(handler(teacherAbility)).toBe(false);
      expect(handler(studentAbility)).toBe(false);
    });
  });
});
