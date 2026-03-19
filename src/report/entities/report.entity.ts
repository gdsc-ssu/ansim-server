import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';
import { Image } from '../../image/entities/image.entity';
import { Marker } from '../../marker/entities/marker.entity';
import { User } from '../../user/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: HazardType })
  hazardType: HazardType;

  @Column({ type: 'enum', enum: HazardLevel })
  hazardLevel: HazardLevel;

  @Column('text')
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  aiRawResult: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reports)
  user: User;

  @OneToMany(() => Image, (image) => image.report)
  images: Image[];

  @OneToOne(() => Marker, (marker) => marker.report)
  marker: Marker;
}
