import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    const input = { email: 'jane@example.com', password: 'hashed', fullName: 'Jane Doe' };

    it('creates and saves a new user when the email is not taken', async () => {
      repository.findOne?.mockResolvedValue(null);
      repository.create?.mockReturnValue(input);
      repository.save?.mockResolvedValue({ id: '1', ...input });

      const result = await service.create(input);

      expect(repository.create).toHaveBeenCalledWith(input);
      expect(repository.save).toHaveBeenCalledWith(input);
      expect(result).toEqual({ id: '1', ...input });
    });

    it('throws ConflictException when the email is already registered', async () => {
      repository.findOne?.mockResolvedValue({ id: '1', ...input });

      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('queries by email', async () => {
      repository.findOne?.mockResolvedValue(null);

      await service.findByEmail('jane@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'jane@example.com' } });
    });
  });

  describe('findById', () => {
    it('queries by id', async () => {
      repository.findOne?.mockResolvedValue(null);

      await service.findById('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findAll', () => {
    it('returns every user', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      repository.find?.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toBe(users);
    });
  });
});
