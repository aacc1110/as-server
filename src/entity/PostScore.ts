import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('post_scores', { synchronize: true })
export class PostScore extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('varchar', { length: 255, nullable: true })
  type!: string;

  @Column('float8', { default: 0 })
  score!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string;
  @ManyToOne(() => User, user => user.postscore, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Index()
  @Column('uuid', { nullable: true })
  postId!: string;
  @ManyToOne(() => Post, post => post.postscore, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;
}
