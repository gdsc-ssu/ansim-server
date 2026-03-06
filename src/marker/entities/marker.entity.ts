import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../../comment/entities/comment.entity';
import { Like } from '../../like/entities/like.entity';
import { HazardLevel, Report } from '../../report/entities/report.entity';
import { SafetyMungoReport } from '../../safety-mungo-report/entities/safety-mungo-report.entity';

@Entity('markers')
export class Marker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  reportId: string | null;

  @Column({ nullable: true, unique: true })
  safetyMungoReportId: string | null;

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
  location: string | null;

  @Column()
  hazardType: string;

  @Column({ type: 'enum', enum: HazardLevel, nullable: true })
  hazardLevel: HazardLevel | null;

  @OneToOne(() => Report, (report) => report.marker)
  @JoinColumn({ name: 'reportId' })
  report: Report | null;

  @OneToOne(() => SafetyMungoReport, (smr) => smr.marker)
  @JoinColumn({ name: 'safetyMungoReportId' })
  safetyMungoReport: SafetyMungoReport | null;

  @OneToMany(() => Comment, (comment) => comment.marker)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.marker)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;
}
