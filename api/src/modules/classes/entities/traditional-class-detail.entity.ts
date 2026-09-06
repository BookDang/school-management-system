import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Classes } from './classes.entity';

/** The fields only a traditional (school) class has - one row per Classes row of that type. */
@Entity('traditional_class_details')
export class TraditionalClassDetail {
  @PrimaryColumn('uuid')
  classId: string;

  @OneToOne(() => Classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  classEntity: Classes;

  @Column()
  gradeLevel: string;
}
