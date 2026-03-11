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
import { Image } from '../../image/entities/image.entity';
import { Marker } from '../../marker/entities/marker.entity';
import { User } from '../../user/entities/user.entity';

export enum HazardLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  hazardType: string;

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
