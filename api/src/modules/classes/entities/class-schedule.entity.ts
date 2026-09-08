import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Classes } from './classes.entity';
import { DayOfWeek } from './day-of-week.enum';

/** One scheduled offering (section/term) of a class — a Classes row can have many of these, since
 * the same class can be reused across multiple schedules (e.g. a weekday-evening section and a
 * separate weekend section). */
@Entity('class_schedules')
export class ClassSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @ManyToOne(() => Classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  classEntity: Classes;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column('simple-array')
  daysOfWeek: DayOfWeek[];

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
