import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../../comment/entities/comment.entity';
import { Like } from '../../like/entities/like.entity';
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
  imageUrl: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

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

  @ManyToOne(() => User, (user) => user.reports)
  user: User;

  @OneToMany(() => Comment, (comment) => comment.report)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.report)
  likes: Like[];
}
