import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { Marker } from '../../marker/entities/marker.entity';

@Entity('safety_mungo_reports')
export class SafetyMungoReport {
  @PrimaryColumn()
  externalReportId: string;

  @Column({ nullable: true })
  externalId: string | null;

  @Column({ nullable: true })
  spotName: string | null;

  @Column({ nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ nullable: true })
  origin: string | null;

  @Column({ type: 'date', nullable: true })
  occurrenceDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  syncedAt: Date | null;

  @OneToOne(() => Marker, (marker) => marker.safetyMungoReport)
  marker: Marker;
}
