import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  BaseEntity,
} from 'typeorm';
import { Post } from './Post';
import { Series } from './Series';

@Entity('series_posts', {
  synchronize: true,
})
export class SeriesPosts extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int4')
  index!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index()
  @Column('uuid')
  postId!: string;
  @ManyToOne(() => Post, post => post.seriesposts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post[];

  @Index()
  @Column('uuid')
  seriesId!: string;
  @ManyToOne(() => Series, series => series.seriesposts, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  series!: Series[];
}
