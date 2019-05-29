import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { User } from './User';

@Entity('user_profile', { synchronize: false })
export class UserProfile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { nullable: true, length: 255 })
  thumbnail!: string;

  @Column('varchar', { nullable: true, length: 255 })
  mobile!: string;

  @Column('text', { nullable: true })
  about!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.userprofiles)
  user!: User;
}
