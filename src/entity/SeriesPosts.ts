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
} from 'typeorm';
import DataLoader from 'dataloader';
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
  @ManyToOne(() => Post, post => post.seriesposts, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  post!: Post;

  @Index()
  @Column('uuid')
  seriesId!: string;
  @ManyToOne(() => Series, series => series.seriesposts, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  series!: Series;
}

export const createSeriesPostsLoader = () =>
  new DataLoader<string, SeriesPosts[]>(async seriesIds => {
    const repo = getRepository(SeriesPosts);
    const seriesPosts = await repo
      .createQueryBuilder('series_posts')
      .where('fk_series_id IN (:...seriesIds)', { seriesIds })
      .leftJoinAndSelect('series_posts.post', 'post')
      .orderBy('fk_series_id', 'ASC')
      .orderBy('index', 'ASC')
      .getMany();

    const postsMap: {
      [key: string]: SeriesPosts[];
    } = {};
    seriesIds.forEach(seriesId => (postsMap[seriesId] = []));
    seriesPosts.forEach(sp => {
      postsMap[sp.seriesId].push(sp);
    });
    const ordered = seriesIds.map(seriesId => postsMap[seriesId]);
    return ordered;
  });

export const subtractIndexAfter = async (seriesId: string, afterIndex: number) => {
  const repo = getRepository(SeriesPosts);
  return repo
    .createQueryBuilder()
    .update(SeriesPosts)
    .set({ index: () => 'index - 1' })
    .where('fk_series_id = :seriesId', { seriesId })
    .andWhere('index > :afterIndex', { afterIndex })
    .execute();
};

export const appendToSeries = async (seriesId: string, postId: string) => {
  const repo = getRepository(SeriesPosts);
  const seriesRepo = getRepository(Series);
  const postsCount = await repo.count({
    where: {
      seriesId,
    },
  });
  const nextIndex = postsCount + 1;
  const series = await seriesRepo.findOne(seriesId);
  if (!series) return;

  await seriesRepo
    .createQueryBuilder()
    .update(Series)
    .where('id = :id', { id: seriesId })
    .execute();

  const seriesPosts = new SeriesPosts();
  seriesPosts.postId = postId;
  seriesPosts.seriesId = seriesId;
  seriesPosts.index = nextIndex;
  return repo.save(seriesPosts);
};
