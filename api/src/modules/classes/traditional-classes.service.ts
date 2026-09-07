import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { CreateTraditionalClassDto } from './dto/create-traditional-class.dto';
import type { UpdateTraditionalClassDto } from './dto/update-traditional-class.dto';
import { ClassType } from './entities/class-type.enum';
import { Classes } from './entities/classes.entity';
import { TraditionalClassDetail } from './entities/traditional-class-detail.entity';

export class TraditionalClassView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  gradeLevel: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

const toView = (classEntity: Classes, detail: TraditionalClassDetail): TraditionalClassView => ({
  id: classEntity.id,
  name: classEntity.name,
  teacherId: classEntity.teacherId,
  capacity: classEntity.capacity,
  gradeLevel: detail.gradeLevel,
  createdAt: classEntity.createdAt,
  updatedAt: classEntity.updatedAt,
});

@Injectable()
export class TraditionalClassesService {
  constructor(
    @InjectRepository(Classes)
    private readonly classesRepository: Repository<Classes>,
    @InjectRepository(TraditionalClassDetail)
    private readonly detailsRepository: Repository<TraditionalClassDetail>,
    private readonly dataSource: DataSource,
  ) {}

  create(input: CreateTraditionalClassDto): Promise<TraditionalClassView> {
    return this.dataSource.transaction(async (manager) => {
      const classEntity = await manager.save(
        manager.create(Classes, {
          name: input.name,
          teacherId: input.teacherId,
          capacity: input.capacity,
          type: ClassType.Traditional,
        }),
      );
      const detail = await manager.save(
        manager.create(TraditionalClassDetail, {
          classId: classEntity.id,
          gradeLevel: input.gradeLevel,
        }),
      );

      return toView(classEntity, detail);
    });
  }

  async findAll(): Promise<TraditionalClassView[]> {
    const details = await this.detailsRepository.find({ relations: { classEntity: true } });
    return details.map((detail) => toView(detail.classEntity, detail));
  }

  async findById(id: string): Promise<TraditionalClassView | null> {
    const detail = await this.detailsRepository.findOne({
      where: { classId: id },
      relations: { classEntity: true },
    });

    return detail ? toView(detail.classEntity, detail) : null;
  }

  /** Raw base-table entity, for the controller's CASL ownership check - not the flattened view. */
  findEntityById(id: string): Promise<Classes | null> {
    return this.classesRepository.findOne({ where: { id, type: ClassType.Traditional } });
  }

  async update(id: string, input: UpdateTraditionalClassDto): Promise<TraditionalClassView> {
    const detail = await this.detailsRepository.findOne({
      where: { classId: id },
      relations: { classEntity: true },
    });
    if (!detail) {
      throw new NotFoundException('Class not found');
    }

    const { gradeLevel, ...classFields } = input;

    return this.dataSource.transaction(async (manager) => {
      Object.assign(detail.classEntity, classFields);
      const classEntity = await manager.save(detail.classEntity);

      if (gradeLevel !== undefined) {
        detail.gradeLevel = gradeLevel;
      }
      const savedDetail = await manager.save(detail);

      return toView(classEntity, savedDetail);
    });
  }

  async remove(id: string): Promise<void> {
    // The detail row cascades via TraditionalClassDetail's onDelete: 'CASCADE' foreign key.
    const result = await this.classesRepository.delete({ id, type: ClassType.Traditional });
    if (result.affected === 0) {
      throw new NotFoundException('Class not found');
    }
  }
}
