import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Tag } from './Tag';
import { Image } from './Image';
import { Comment } from './Comment';

@Entity('posts', { synchronize: true })
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('varchar', { length: 255, nullable: true })
  title!: string;

  @Index()
  @Column('text', { nullable: true })
  body!: string;

  @Column('boolean', { default: false, nullable: true })
  isPublish!: boolean;

  @Index()
  @Column({ default: {}, type: 'jsonb', nullable: true })
  meta!: object;

  @Column('int', { default: 0 })
  viewsCount!: number;

  @Column('varchar', { length: 255, nullable: true })
  shortSummary!: string;

  @Column('varchar', { length: 255 })
  urlPath!: string;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'now()', nullable: false })
  releasedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.posts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user!: User;

  @ManyToMany(() => Tag, tags => tags.posts, {
    eager: true,
    cascade: true,
  })
  @JoinTable({ name: 'posts_tags' })
  tags!: Tag[];

  @OneToMany(() => Image, images => images.posts, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  images!: Image[];

  @OneToMany(() => Comment, comments => comments.posts, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  comments!: Comment[];
}
