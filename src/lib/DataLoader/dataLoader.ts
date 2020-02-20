import DataLoader from 'dataloader';
import { User } from '../../entity/User';
import { createQueryBuilder, getRepository } from 'typeorm';
import { Post } from '../../entity/Post';
import { normalize } from '../utils';
import { Comment } from '../../entity/Comment';
import { Series } from '../../entity/Series';
import { SeriesPosts } from '../../entity/SeriesPosts';

export const createUserLoader = () =>
  new DataLoader<string, User>(async userIds => {
    const users = await createQueryBuilder(User, 'user')
      .whereInIds(userIds)
      .getMany();

    const normalized = normalize(users, user => user.id);
    return userIds.map(id => normalized[id]);

    // return User.findByIds(ids);
  });

export const createCommentsLoader = () =>
  new DataLoader<string, Comment[]>(async postIds => {
    const posts = await createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.comments', 'comment')
      .whereInIds(postIds)
      .andWhere('comment.level = 0')
      .andWhere('comment.deleted = false')
      // .andWhere('comment.deleted = false or comment.hasReplies = true')
      .orderBy({
        'comment.createdAt': 'DESC',
      })
      .getMany();

    const normalized = normalize<Post>(posts);

    const commentsGroups = postIds.map(id => (normalized[id] ? normalized[id].comments : []));
    return commentsGroups;
  });

// export const createTagsLoader = () =>
//   new DataLoader<string, Tag[]>(async postIds => {
//     const postsTags = await createQueryBuilder('posts_tags')
//       .where('postsId IN (:...postIds)', { postIds })
//       .leftJoinAndSelect('posts_tags.tag', 'tag')
//       .orderBy('postsId', 'ASC')
//       .orderBy('tag.name', 'ASC')
//       .getMany();

//     return groupById<PostsTags>(postIds, postsTags, pt => pt.postId).map(array =>
//       array.map(pt => pt.tag),
//     );
//   });

export const createSeriesListLoader = () =>
  new DataLoader<string, Series[]>(async userIds => {
    const repo = getRepository(Series);
    const seriesList = await repo
      .createQueryBuilder('series')
      .where('series.userId IN (:...userIds)', { userIds })
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

export const createSeriesPostsLoader = () =>
  new DataLoader<string, SeriesPosts[]>(async seriesIds => {
    const repo = getRepository(SeriesPosts);
    const seriesPosts = await repo
      .createQueryBuilder('seriesPosts')
      .where('seriesPosts.seriesId IN (:...seriesIds)', { seriesIds })
      .leftJoinAndSelect('seriesPosts.post', 'post')
      .orderBy('seriesPosts.seriesId', 'ASC')
      .orderBy('seriesPosts.index', 'ASC')
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
    .where('seriesId = :seriesId', { seriesId })
    .andWhere('index > :afterIndex', { afterIndex })
    .execute();
};

export const appendToSeries = async (seriesId: string, postId: string) => {
  const seriesRepo = getRepository(Series);
  const postsCount = await SeriesPosts.count({ seriesId });
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
  return SeriesPosts.save(seriesPosts);
};
