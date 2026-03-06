import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Marker } from '../../marker/entities/marker.entity';
import { User } from '../../user/entities/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  markerId: string;

  @Column()
  userId: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Marker, (marker) => marker.comments, { onDelete: 'CASCADE' })
  marker: Marker;

  @ManyToOne(() => User, (user) => user.comments)
  user: User;
}
