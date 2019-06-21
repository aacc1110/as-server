import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Post } from './Post';
import { User } from './User';

@Entity('comments', { synchronize: true })
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { nullable: true })
  comment!: string;

  @Column('int', { default: 0 })
  level!: number;

  @Column('int', { default: 0 })
  like!: number;

  @Column('int', { default: 0 })
  hate!: number;

  @Column({ default: false })
  deleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: Promise<User>;

  @ManyToOne(() => Post, posts => posts.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  posts!: Post;
}
