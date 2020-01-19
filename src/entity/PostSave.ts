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

@Entity('post_saves', { synchronize: true })
export class PostSave extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string;
  @ManyToOne(() => User, user => user.postsave, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Index()
  @Column('uuid', { nullable: true })
  postId!: string;
  @ManyToOne(() => Post, post => post.postsave, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;
}
