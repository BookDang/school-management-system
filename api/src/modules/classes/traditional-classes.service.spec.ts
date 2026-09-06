import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import { Classes } from './entities/classes.entity';
import { TraditionalClassDetail } from './entities/traditional-class-detail.entity';
import { TraditionalClassesService } from './traditional-classes.service';

type MockRepository<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const createMockManager = () => ({
  create: jest.fn((_entity: unknown, data: unknown) => data),
  save: jest.fn((data: unknown) => Promise.resolve(data)),
});

describe('TraditionalClassesService', () => {
  let service: TraditionalClassesService;
  let classesRepository: MockRepository<Classes>;
  let detailsRepository: MockRepository<TraditionalClassDetail>;
  let manager: ReturnType<typeof createMockManager>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    classesRepository = createMockRepository<Classes>();
    detailsRepository = createMockRepository<TraditionalClassDetail>();
    manager = createMockManager();
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraditionalClassesService,
        { provide: getRepositoryToken(Classes), useValue: classesRepository },
        { provide: getRepositoryToken(TraditionalClassDetail), useValue: detailsRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TraditionalClassesService>(TraditionalClassesService);
  });

  const input = { name: '10A1', teacherId: 'teacher-1', capacity: 30, gradeLevel: '10' };

  describe('create', () => {
    it('creates the base class row and the traditional detail row inside one transaction', async () => {
      manager.save
        .mockResolvedValueOnce({
          id: 'class-1',
          name: '10A1',
          teacherId: 'teacher-1',
          capacity: 30,
        })
        .mockResolvedValueOnce({ classId: 'class-1', gradeLevel: '10' });

      const result = await service.create(input);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(manager.create).toHaveBeenCalledWith(
        Classes,
        expect.objectContaining({ name: '10A1', type: 'traditional' }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        TraditionalClassDetail,
        expect.objectContaining({ classId: 'class-1', gradeLevel: '10' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'class-1',
          name: '10A1',
          teacherId: 'teacher-1',
          capacity: 30,
          gradeLevel: '10',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('joins every detail row with its class row', async () => {
      const classEntity = { id: 'class-1', name: '10A1', teacherId: 'teacher-1', capacity: 30 };
      detailsRepository.find?.mockResolvedValue([
        { classId: 'class-1', gradeLevel: '10', classEntity },
      ]);

      const result = await service.findAll();

      expect(detailsRepository.find).toHaveBeenCalledWith({ relations: { classEntity: true } });
      expect(result).toEqual([expect.objectContaining({ id: 'class-1', gradeLevel: '10' })]);
    });
  });

  describe('findById', () => {
    it('returns null when there is no detail row for that id', async () => {
      detailsRepository.findOne?.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findEntityById', () => {
    it('scopes the query to the traditional type', async () => {
      classesRepository.findOne?.mockResolvedValue(null);

      await service.findEntityById('class-1');

      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-1', type: 'traditional' },
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the class does not exist', async () => {
      detailsRepository.findOne?.mockResolvedValue(null);

      await expect(service.update('missing', { capacity: 25 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates base fields and the grade level together', async () => {
      const classEntity = { id: 'class-1', name: '10A1', teacherId: 'teacher-1', capacity: 30 };
      const detail = { classId: 'class-1', gradeLevel: '10', classEntity };
      detailsRepository.findOne?.mockResolvedValue(detail);
      manager.save.mockImplementation((value: unknown) => Promise.resolve(value));

      const result = await service.update('class-1', { capacity: 25, gradeLevel: '11' });

      expect(classEntity.capacity).toBe(25);
      expect(detail.gradeLevel).toBe('11');
      expect(result).toEqual(expect.objectContaining({ capacity: 25, gradeLevel: '11' }));
    });
  });

  describe('remove', () => {
    it('deletes the class scoped to the traditional type', async () => {
      classesRepository.delete?.mockResolvedValue({ affected: 1 });

      await service.remove('class-1');

      expect(classesRepository.delete).toHaveBeenCalledWith({
        id: 'class-1',
        type: 'traditional',
      });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      classesRepository.delete?.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
