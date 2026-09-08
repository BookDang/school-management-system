import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  type PolicyHandlerCallback,
} from '@/modules/authorization/check-policies.decorator';
import { Role } from '@/modules/users/entities/role.enum';
import { ClassSchedulesController } from './class-schedules.controller';
import { ClassSchedulesService } from './class-schedules.service';
import { Classes } from './entities/classes.entity';
import { DayOfWeek } from './entities/day-of-week.enum';

describe('ClassSchedulesController', () => {
  let controller: ClassSchedulesController;
  let service: {
    create: jest.Mock;
    findAllForClass: jest.Mock;
    findOne: jest.Mock;
    findClassEntityById: jest.Mock;
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
  const dto = {
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    daysOfWeek: [DayOfWeek.Monday, DayOfWeek.Wednesday],
    startTime: '18:00',
    endTime: '20:00',
  };
  const view = { id: 'sched-1', classId: 'class-1', ...dto };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllForClass: jest.fn(),
      findOne: jest.fn(),
      findClassEntityById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassSchedulesController],
      providers: [{ provide: ClassSchedulesService, useValue: service }, CaslAbilityFactory],
    }).compile();

    controller = module.get<ClassSchedulesController>(ClassSchedulesController);
  });

  describe('create', () => {
    it('allows a teacher to add a schedule to their own class', async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);
      service.create.mockResolvedValue(view);

      const result = await controller.create('class-1', dto, teacher);

      expect(service.create).toHaveBeenCalledWith('class-1', dto);
      expect(result).toBe(view);
    });

    it("rejects a teacher managing another teacher's class", async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);

      await expect(controller.create('class-1', dto, otherTeacher)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(service.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the class does not exist', async () => {
      service.findClassEntityById.mockResolvedValue(null);

      await expect(controller.create('missing', dto, teacher)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns the schedules when the class exists', async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);
      service.findAllForClass.mockResolvedValue([view]);

      const result = await controller.findAll('class-1');

      expect(result).toEqual([view]);
    });

    it('throws NotFoundException when the class does not exist', async () => {
      service.findClassEntityById.mockResolvedValue(null);

      await expect(controller.findAll('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns the schedule when it exists', async () => {
      service.findOne.mockResolvedValue(view);

      const result = await controller.findOne('class-1', 'sched-1');

      expect(result).toBe(view);
    });

    it('throws NotFoundException when it does not exist', async () => {
      service.findOne.mockResolvedValue(null);

      await expect(controller.findOne('class-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('allows a teacher to update a schedule on their own class', async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);
      service.update.mockResolvedValue({ ...view, startTime: '19:00' });

      const result = await controller.update('class-1', 'sched-1', { startTime: '19:00' }, teacher);

      expect(service.update).toHaveBeenCalledWith('class-1', 'sched-1', { startTime: '19:00' });
      expect(result).toEqual({ ...view, startTime: '19:00' });
    });

    it("rejects a teacher managing another teacher's class", async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);

      await expect(
        controller.update('class-1', 'sched-1', { startTime: '19:00' }, otherTeacher),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('allows an admin to update any class schedule', async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);
      service.update.mockResolvedValue({ ...view, startTime: '19:00' });

      await controller.update('class-1', 'sched-1', { startTime: '19:00' }, admin);

      expect(service.update).toHaveBeenCalledWith('class-1', 'sched-1', { startTime: '19:00' });
    });
  });

  describe('remove', () => {
    it('deletes the schedule after the ownership check passes', async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);

      await controller.remove('class-1', 'sched-1', teacher);

      expect(service.remove).toHaveBeenCalledWith('class-1', 'sched-1');
    });

    it("rejects a teacher managing another teacher's class", async () => {
      service.findClassEntityById.mockResolvedValue(classEntity);

      await expect(controller.remove('class-1', 'sched-1', otherTeacher)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(service.remove).not.toHaveBeenCalled();
    });
  });

  describe('policy handlers', () => {
    const caslAbilityFactory = new CaslAbilityFactory();
    const adminAbility = caslAbilityFactory.createForUser(admin);
    const teacherAbility = caslAbilityFactory.createForUser(teacher);
    const studentAbility = caslAbilityFactory.createForUser(student);

    const getHandlers = (method: (...args: never[]) => unknown): PolicyHandlerCallback[] =>
      Reflect.getMetadata(CHECK_POLICIES_KEY, method) ?? [];

    it('requires some Update rule on Classes for create/update/remove (student has none)', () => {
      const handlers = [
        getHandlers(ClassSchedulesController.prototype.create)[0],
        getHandlers(ClassSchedulesController.prototype.update)[0],
        getHandlers(ClassSchedulesController.prototype.remove)[0],
      ];

      for (const handler of handlers) {
        expect(handler(adminAbility)).toBe(true);
        expect(handler(teacherAbility)).toBe(true);
        expect(handler(studentAbility)).toBe(false);
      }
    });

    it('requires Read on Classes for findAll and findOne (everyone)', () => {
      const [findAllHandler] = getHandlers(ClassSchedulesController.prototype.findAll);
      const [findOneHandler] = getHandlers(ClassSchedulesController.prototype.findOne);

      for (const handler of [findAllHandler, findOneHandler]) {
        expect(handler(adminAbility)).toBe(true);
        expect(handler(teacherAbility)).toBe(true);
        expect(handler(studentAbility)).toBe(true);
      }
    });
  });
});
