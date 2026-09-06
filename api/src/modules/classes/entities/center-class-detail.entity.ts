import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Classes } from './classes.entity';

/** The fields only a center (tutoring center) class has - one row per Classes row of that type. */
@Entity('center_class_details')
export class CenterClassDetail {
  @PrimaryColumn('uuid')
  classId: string;

  @OneToOne(() => Classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  classEntity: Classes;

  @Column()
  subject: string;
}
