import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Report } from '../../report/entities/report.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportId: string;

  @Column()
  url: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  size: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Report, (report) => report.images, { onDelete: 'CASCADE' })
  report: Report;
}
