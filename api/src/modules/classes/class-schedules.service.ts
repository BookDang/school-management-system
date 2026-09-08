import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import type { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassSchedule } from './entities/class-schedule.entity';
import { Classes } from './entities/classes.entity';
import { DayOfWeek } from './entities/day-of-week.enum';

export class ClassScheduleView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  classId: string;

  @ApiProperty({ format: 'date' })
  startDate: string;

  @ApiProperty({ format: 'date' })
  endDate: string;

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  daysOfWeek: DayOfWeek[];

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

const toView = (schedule: ClassSchedule): ClassScheduleView => ({
  id: schedule.id,
  classId: schedule.classId,
  startDate: schedule.startDate,
  endDate: schedule.endDate,
  daysOfWeek: schedule.daysOfWeek,
  startTime: schedule.startTime,
  endTime: schedule.endTime,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
});

@Injectable()
export class ClassSchedulesService {
  constructor(
    @InjectRepository(ClassSchedule)
    private readonly scheduleRepository: Repository<ClassSchedule>,
    @InjectRepository(Classes)
    private readonly classesRepository: Repository<Classes>,
  ) {}

  /** For the controller's CASL ownership check - the base Classes entity, regardless of type. */
  findClassEntityById(classId: string): Promise<Classes | null> {
    return this.classesRepository.findOne({ where: { id: classId } });
  }

  async create(classId: string, input: CreateClassScheduleDto): Promise<ClassScheduleView> {
    const saved = await this.scheduleRepository.save(
      this.scheduleRepository.create({ classId, ...input }),
    );

    return toView(saved);
  }

  async findAllForClass(classId: string): Promise<ClassScheduleView[]> {
    const schedules = await this.scheduleRepository.find({ where: { classId } });
    return schedules.map(toView);
  }

  async findOne(classId: string, id: string): Promise<ClassScheduleView | null> {
    const schedule = await this.scheduleRepository.findOne({ where: { id, classId } });
    return schedule ? toView(schedule) : null;
  }

  async update(
    classId: string,
    id: string,
    input: UpdateClassScheduleDto,
  ): Promise<ClassScheduleView> {
    const schedule = await this.scheduleRepository.findOne({ where: { id, classId } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    Object.assign(schedule, input);
    const saved = await this.scheduleRepository.save(schedule);

    return toView(saved);
  }

  async remove(classId: string, id: string): Promise<void> {
    const result = await this.scheduleRepository.delete({ id, classId });
    if (result.affected === 0) {
      throw new NotFoundException('Schedule not found');
    }
  }
}
