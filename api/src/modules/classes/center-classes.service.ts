import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { CreateCenterClassDto } from './dto/create-center-class.dto';
import type { UpdateCenterClassDto } from './dto/update-center-class.dto';
import { CenterClassDetail } from './entities/center-class-detail.entity';
import { ClassType } from './entities/class-type.enum';
import { Classes } from './entities/classes.entity';

export class CenterClassView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

const toView = (classEntity: Classes, detail: CenterClassDetail): CenterClassView => ({
  id: classEntity.id,
  name: classEntity.name,
  teacherId: classEntity.teacherId,
  capacity: classEntity.capacity,
  subject: detail.subject,
  createdAt: classEntity.createdAt,
  updatedAt: classEntity.updatedAt,
});

@Injectable()
export class CenterClassesService {
  constructor(
    @InjectRepository(Classes)
    private readonly classesRepository: Repository<Classes>,
    @InjectRepository(CenterClassDetail)
    private readonly detailsRepository: Repository<CenterClassDetail>,
    private readonly dataSource: DataSource,
  ) {}

  create(input: CreateCenterClassDto): Promise<CenterClassView> {
    return this.dataSource.transaction(async (manager) => {
      const classEntity = await manager.save(
        manager.create(Classes, {
          name: input.name,
          teacherId: input.teacherId,
          capacity: input.capacity,
          type: ClassType.Center,
        }),
      );
      const detail = await manager.save(
        manager.create(CenterClassDetail, {
          classId: classEntity.id,
          subject: input.subject,
        }),
      );

      return toView(classEntity, detail);
    });
  }

  async findAll(): Promise<CenterClassView[]> {
    const details = await this.detailsRepository.find({ relations: { classEntity: true } });
    return details.map((detail) => toView(detail.classEntity, detail));
  }

  async findById(id: string): Promise<CenterClassView | null> {
    const detail = await this.detailsRepository.findOne({
      where: { classId: id },
      relations: { classEntity: true },
    });

    return detail ? toView(detail.classEntity, detail) : null;
  }

  /** Raw base-table entity, for the controller's CASL ownership check - not the flattened view. */
  findEntityById(id: string): Promise<Classes | null> {
    return this.classesRepository.findOne({ where: { id, type: ClassType.Center } });
  }

  async update(id: string, input: UpdateCenterClassDto): Promise<CenterClassView> {
    const detail = await this.detailsRepository.findOne({
      where: { classId: id },
      relations: { classEntity: true },
    });
    if (!detail) {
      throw new NotFoundException('Class not found');
    }

    const { subject, ...classFields } = input;

    return this.dataSource.transaction(async (manager) => {
      Object.assign(detail.classEntity, classFields);
      const classEntity = await manager.save(detail.classEntity);

      if (subject !== undefined) {
        detail.subject = subject;
      }
      const savedDetail = await manager.save(detail);

      return toView(classEntity, savedDetail);
    });
  }

  async remove(id: string): Promise<void> {
    // The detail row cascades via CenterClassDetail's onDelete: 'CASCADE' foreign key.
    const result = await this.classesRepository.delete({ id, type: ClassType.Center });
    if (result.affected === 0) {
      throw new NotFoundException('Class not found');
    }
  }
}
