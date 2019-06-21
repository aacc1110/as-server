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

@Entity('user_token', { synchronize: true })
export class UserToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tokenId!: string;

  @Column('int', { default: 0 })
  faultyCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column('uuid', { nullable: true })
  userId!: string;
  @OneToOne(() => User, user => user.usertoken, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;
}
