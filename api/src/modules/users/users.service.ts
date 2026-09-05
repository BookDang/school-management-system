import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Role } from './entities/role.enum';
import { User } from './entities/user.entity';

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async setRefreshToken(id: string, hashedRefreshToken: string | null): Promise<void> {
    await this.usersRepository.update({ id }, { hashedRefreshToken });
  }
}
