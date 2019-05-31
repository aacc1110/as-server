import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne
} from 'typeorm';
import { User } from './User';

@Entity('posts', { synchronize: true })
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('varchar', { length: 255, nullable: true })
  title!: string;

  @Index()
  @Column('varchar', { length: 255, nullable: true })
  body!: string;

  @Column('varchar', { length: 255, nullable: true })
  image!: string;

  @Column('boolean', { default: false, nullable: true })
  is_publish!: boolean;

  @Index()
  @Column({ default: {}, type: 'jsonb', nullable: true })
  meta!: object;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'now()', nullable: false })
  releasedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.posts)
  user!: User;
}
