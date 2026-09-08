import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ClassSchedulesService } from './class-schedules.service';
import { ClassSchedule } from './entities/class-schedule.entity';
import { Classes } from './entities/classes.entity';
import { DayOfWeek } from './entities/day-of-week.enum';

type MockRepository<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((data: unknown) => data),
  save: jest.fn((data: unknown) => Promise.resolve(data)),
  delete: jest.fn(),
});

describe('ClassSchedulesService', () => {
  let service: ClassSchedulesService;
  let scheduleRepository: MockRepository<ClassSchedule>;
  let classesRepository: MockRepository<Classes>;

  const input = {
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    daysOfWeek: [DayOfWeek.Monday, DayOfWeek.Wednesday],
    startTime: '18:00',
    endTime: '20:00',
  };

  beforeEach(async () => {
    scheduleRepository = createMockRepository<ClassSchedule>();
    classesRepository = createMockRepository<Classes>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassSchedulesService,
        { provide: getRepositoryToken(ClassSchedule), useValue: scheduleRepository },
        { provide: getRepositoryToken(Classes), useValue: classesRepository },
      ],
    }).compile();

    service = module.get<ClassSchedulesService>(ClassSchedulesService);
  });

  describe('findClassEntityById', () => {
    it('looks up the base class regardless of type', async () => {
      classesRepository.findOne?.mockResolvedValue(null);

      await service.findClassEntityById('class-1');

      expect(classesRepository.findOne).toHaveBeenCalledWith({ where: { id: 'class-1' } });
    });
  });

  describe('create', () => {
    it('saves a schedule scoped to the class', async () => {
      const result = await service.create('class-1', input);

      expect(scheduleRepository.create).toHaveBeenCalledWith({ classId: 'class-1', ...input });
      expect(result).toEqual(expect.objectContaining({ classId: 'class-1', ...input }));
    });
  });

  describe('findAllForClass', () => {
    it('lists schedules scoped to the class', async () => {
      scheduleRepository.find?.mockResolvedValue([{ id: 'sched-1', classId: 'class-1', ...input }]);

      const result = await service.findAllForClass('class-1');

      expect(scheduleRepository.find).toHaveBeenCalledWith({ where: { classId: 'class-1' } });
      expect(result).toEqual([expect.objectContaining({ id: 'sched-1' })]);
    });
  });

  describe('findOne', () => {
    it('returns null when the schedule does not exist', async () => {
      scheduleRepository.findOne?.mockResolvedValue(null);

      const result = await service.findOne('class-1', 'missing');

      expect(result).toBeNull();
    });

    it('returns the schedule when found', async () => {
      scheduleRepository.findOne?.mockResolvedValue({
        id: 'sched-1',
        classId: 'class-1',
        ...input,
      });

      const result = await service.findOne('class-1', 'sched-1');

      expect(result).toEqual(expect.objectContaining({ id: 'sched-1' }));
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the schedule does not exist', async () => {
      scheduleRepository.findOne?.mockResolvedValue(null);

      await expect(
        service.update('class-1', 'missing', { capacity: 20 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('merges the update into the existing schedule', async () => {
      const schedule = { id: 'sched-1', classId: 'class-1', ...input };
      scheduleRepository.findOne?.mockResolvedValue(schedule);

      const result = await service.update('class-1', 'sched-1', { startTime: '19:00' });

      expect(schedule.startTime).toBe('19:00');
      expect(result).toEqual(expect.objectContaining({ startTime: '19:00' }));
    });
  });

  describe('remove', () => {
    it('deletes the schedule scoped to the class', async () => {
      scheduleRepository.delete?.mockResolvedValue({ affected: 1 });

      await service.remove('class-1', 'sched-1');

      expect(scheduleRepository.delete).toHaveBeenCalledWith({ id: 'sched-1', classId: 'class-1' });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      scheduleRepository.delete?.mockResolvedValue({ affected: 0 });

      await expect(service.remove('class-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
