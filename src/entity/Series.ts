import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  getRepository,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import DataLoader from 'dataloader';
import { User } from './User';
import { SeriesPosts } from './SeriesPosts';

@Entity('series', {
  synchronize: true,
})
export class Series extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column({ length: 255, nullable: true })
  thumbnail!: string;

  @Column({ length: 255 })
  urlPath!: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Index()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => SeriesPosts, seriesposts => seriesposts.series, { cascade: true })
  @JoinColumn()
  seriesposts!: SeriesPosts[];

  @Column('uuid')
  userId!: string;
  @ManyToOne(() => User, user => user.series, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;
}

export const createSeriesListLoader = () =>
  new DataLoader<string, Series[]>(async userIds => {
    const repo = getRepository(Series);
    const seriesList = await repo
      .createQueryBuilder('series')
      .where('fk_user_id IN (:...userIds)', { userIds })
      .getMany();
    const seriesListMap: {
      [key: string]: Series[];
    } = {};
    userIds.forEach(userId => (seriesListMap[userId] = []));
    seriesList.forEach(series => {
      seriesListMap[series.userId].push(series);
    });
    const ordered = userIds.map(userId => seriesListMap[userId]);
    return ordered;
  });
