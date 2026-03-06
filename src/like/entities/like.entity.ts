import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Marker } from '../../marker/entities/marker.entity';
import { User } from '../../user/entities/user.entity';

@Unique(['markerId', 'userId'])
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  markerId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Marker, (marker) => marker.likes, { onDelete: 'CASCADE' })
  marker: Marker;

  @ManyToOne(() => User, (user) => user.likes)
  user: User;
}
