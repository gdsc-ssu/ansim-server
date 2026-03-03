import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Report } from '../../report/entities/report.entity';
import { User } from '../../user/entities/user.entity';

@Unique(['reportId', 'userId'])
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Report, (report) => report.likes)
  report: Report;

  @ManyToOne(() => User, (user) => user.likes)
  user: User;
}
