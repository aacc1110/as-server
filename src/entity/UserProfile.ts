import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';

@Entity('user_profile', { synchronize: true })
export class UserProfile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { nullable: true, length: 255 })
  thumbnail!: string;

  @Column('varchar', { nullable: true, length: 255 })
  mobile!: string;

  @Column('text', { nullable: true })
  about!: string;

  @Column('varchar', { nullable: true, length: 255 })
  image_url!: string;

  @Column('boolean', { default: false })
  admin!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, user => user.userprofile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;
}
