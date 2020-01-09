import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Post } from './Post';
import { User } from './User';

@Entity('comments', { synchronize: true })
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  replyTo!: string;

  @Column({ default: false })
  hasReplies!: boolean;

  @Column('text', { nullable: true })
  text!: string;

  @Column('int', { default: 0 })
  level!: number;

  @Column('int', { default: 0 })
  like!: number;

  @Column('int', { default: 0 })
  hate!: number;

  @Column({ default: false })
  deleted!: boolean;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string;
  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Index()
  @Column('uuid', { nullable: true })
  postId!: string;
  @ManyToOne(() => Post, post => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  subcomments!: Comment[];
}
