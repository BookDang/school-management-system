import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClassType } from './class-type.enum';

/** Shared fields for every class regardless of type - see traditional-class-detail.entity.ts /
 * center-class-detail.entity.ts for the fields specific to each type. */
@Entity('classes')
export class Classes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ClassType })
  type: ClassType;

  @Column()
  teacherId: string;

  @Column()
  capacity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
