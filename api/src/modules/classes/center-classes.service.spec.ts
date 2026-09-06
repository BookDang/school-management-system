import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import { CenterClassesService } from './center-classes.service';
import { CenterClassDetail } from './entities/center-class-detail.entity';
import { Classes } from './entities/classes.entity';

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

describe('CenterClassesService', () => {
  let service: CenterClassesService;
  let classesRepository: MockRepository<Classes>;
  let detailsRepository: MockRepository<CenterClassDetail>;
  let manager: ReturnType<typeof createMockManager>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    classesRepository = createMockRepository<Classes>();
    detailsRepository = createMockRepository<CenterClassDetail>();
    manager = createMockManager();
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CenterClassesService,
        { provide: getRepositoryToken(Classes), useValue: classesRepository },
        { provide: getRepositoryToken(CenterClassDetail), useValue: detailsRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CenterClassesService>(CenterClassesService);
  });

  const input = {
    name: 'IELTS Foundation',
    teacherId: 'teacher-1',
    capacity: 15,
    subject: 'English',
  };

  describe('create', () => {
    it('creates the base class row and the center detail row inside one transaction', async () => {
      manager.save
        .mockResolvedValueOnce({
          id: 'class-1',
          name: 'IELTS Foundation',
          teacherId: 'teacher-1',
          capacity: 15,
        })
        .mockResolvedValueOnce({ classId: 'class-1', subject: 'English' });

      const result = await service.create(input);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(manager.create).toHaveBeenCalledWith(
        Classes,
        expect.objectContaining({ name: 'IELTS Foundation', type: 'center' }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        CenterClassDetail,
        expect.objectContaining({ classId: 'class-1', subject: 'English' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'class-1',
          name: 'IELTS Foundation',
          teacherId: 'teacher-1',
          capacity: 15,
          subject: 'English',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('joins every detail row with its class row', async () => {
      const classEntity = {
        id: 'class-1',
        name: 'IELTS Foundation',
        teacherId: 'teacher-1',
        capacity: 15,
      };
      detailsRepository.find?.mockResolvedValue([
        { classId: 'class-1', subject: 'English', classEntity },
      ]);

      const result = await service.findAll();

      expect(detailsRepository.find).toHaveBeenCalledWith({ relations: { classEntity: true } });
      expect(result).toEqual([expect.objectContaining({ id: 'class-1', subject: 'English' })]);
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
    it('scopes the query to the center type', async () => {
      classesRepository.findOne?.mockResolvedValue(null);

      await service.findEntityById('class-1');

      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-1', type: 'center' },
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the class does not exist', async () => {
      detailsRepository.findOne?.mockResolvedValue(null);

      await expect(service.update('missing', { capacity: 20 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates base fields and the subject together', async () => {
      const classEntity = {
        id: 'class-1',
        name: 'IELTS Foundation',
        teacherId: 'teacher-1',
        capacity: 15,
      };
      const detail = { classId: 'class-1', subject: 'English', classEntity };
      detailsRepository.findOne?.mockResolvedValue(detail);
      manager.save.mockImplementation((value: unknown) => Promise.resolve(value));

      const result = await service.update('class-1', { capacity: 20, subject: 'Math' });

      expect(classEntity.capacity).toBe(20);
      expect(detail.subject).toBe('Math');
      expect(result).toEqual(expect.objectContaining({ capacity: 20, subject: 'Math' }));
    });
  });

  describe('remove', () => {
    it('deletes the class scoped to the center type', async () => {
      classesRepository.delete?.mockResolvedValue({ affected: 1 });

      await service.remove('class-1');

      expect(classesRepository.delete).toHaveBeenCalledWith({ id: 'class-1', type: 'center' });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      classesRepository.delete?.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
