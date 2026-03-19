import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MarkerSource {
  REPORT = 'report',
  SAFETY_MUNGO = 'safety_mungo_report',
}
import { Point } from 'geojson';
import { Comment } from '../../comment/entities/comment.entity';
import { Like } from '../../like/entities/like.entity';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';
import { Report } from '../../report/entities/report.entity';
import { SafetyMungoReport } from '../../safety-mungo-report/entities/safety-mungo-report.entity';

@Entity('markers')
export class Marker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  reportId: string | null;

  @Column({ nullable: true, unique: true })
  safetyMungoReportId: string | null;

  @Column({ type: 'enum', enum: MarkerSource })
  source: MarkerSource;

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
  location: Point | null;

  @Column({ type: 'enum', enum: HazardType })
  hazardType: HazardType;

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
