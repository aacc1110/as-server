import { IResolvers } from 'graphql-tools';
import 'apollo-cache-control';
import { getConnection, getRepository, createQueryBuilder } from 'typeorm';
import { AuthenticationError, ApolloError } from 'apollo-server-koa';
import { v4 } from 'uuid';

import { Post } from '../../entity/Post';
import { Tag } from '../../entity/Tag';
import { Image } from '../../entity/Image';

import shortid from 'shortid';
import { User } from '../../entity/User';
import { Comment } from '../../entity/Comment';
import { PostLike } from '../../entity/PostLike';
import { PostScore } from '../../entity/PostScore';
import hash from '../../lib/hash';
import { PostRead } from '../../entity/PostRead';
import { PostSave } from '../../entity/PostSave';
import { Series } from '../../entity/Series';
import { SeriesPosts } from '../../entity/SeriesPosts';
import { appendToSeries } from '../../lib/DataLoader/dataLoader';
import { normalize } from '../../lib/utils';

export const resolvers: IResolvers = {
  Post: {
    user: (post: Post, __, { loaders }) => {
      if (!post.user) {
        return loaders.user.load(post.userId);
      }
      return post.user;
    },
    comments: (post: Post, __, { loaders }) => {
      if (!post.comments) return post.comments;
      // return loaders.comments.load(post.id);
      return loaders.comments.load(post.id);
    },
    commentsCount: (post: Post) => {
      return Comment.count({ postId: post.id, deleted: false });
    },
    series: async (post: Post) => {
      return await SeriesPosts.findOne({ postId: post.id });
    },
    // series: async (post: Post) => {
    //   const seriesPostsRepo = getRepository(SeriesPosts);
    //   const seriesPosts = await seriesPostsRepo
    //     .createQueryBuilder('seriesPosts')
    //     .leftJoinAndSelect(Series, 'series', 'seriesPosts.seriesId = seriesPosts.id')
    //     .where('seriesPosts.postId = :id', { id: post.id })
    //     .getOne();
    //   if (!seriesPosts) return null;
    //   return seriesPosts.series;
    // },

    liked: async (post: Post, __, { userId }) => {
      if (!userId) return false;
      const liked = await PostLike.findOne({ postId: post.id, userId });
      return !!liked;
    },
    readIt: async (post: Post, __, { ip, userId }) => {
      const ipHash = hash(ip);
      if (userId) {
        const readIt = await PostRead.findOne({ postId: post.id, ipHash });
        if (readIt) {
          if (!readIt.userId) {
            await PostRead.update({ id: readIt.id }, { userId });
          }
        }
        return !!readIt;
      }
      const readIt = await PostRead.findOne({ postId: post.id, ipHash });
      return !!readIt;
    },
    saved: async (post: Post, __, { userId }) => {
      if (userId) {
        const saved = await PostSave.findOne({ postId: post.id, userId });
        return !!saved;
      }
    },
  },
  Query: {
    post: async (_, { useremail, urlPath }) => {
      console.log('useremail:', useremail);
      const post = await createQueryBuilder(Post, 'post')
        .leftJoinAndSelect(User, 'user', 'post.userId = user.id')
        .where('post.urlPath = :urlPath AND user.email = :useremail', { urlPath, useremail })
        .getOne();
      // const post = await Post.findOne({
      //   where: {
      //     email: userEmail,
      //     urlPath,
      //   },
      // });

      if (!post) {
        throw new ApolloError('Post is not found', 'NOT_FOUND');
      }
      return post;
    },
    posts: async (_, { cursor, take = 20 }) => {
      /* info.cacheControl.setCacheHint({ maxAge: 300 }); */
      const query = createQueryBuilder(Post, 'post')
        .take(take)
        .orderBy('post.releasedAt', 'DESC')
        .where('post.isPublish = true');

      if (cursor) {
        const post = await Post.findOne({ id: cursor });
        // console.log('cursorPost', post);
        if (!post) {
          throw new ApolloError('invalid cursor');
        }
        query.andWhere('post.releasedAt < :date', {
          date: post.releasedAt,
          id: post.id,
        });
        query.orWhere('post.releasedAt = :date AND post.id < :id', {
          date: post.releasedAt,
          id: post.id,
        });
      }
      const posts = await query.getMany();
      // console.log('Posts', posts);
      return posts;
    },
    mainPosts: async () => {},

    trendPosts: async (_, { offset = 0, limit = 20, timeframe = 'week' }) => {
      const timeframes: [string, number][] = [['day', 1], ['week', 7], ['month', 30]];
      const selectedTimeframe = timeframes.find(([text]) => text === timeframe);
      if (!selectedTimeframe) {
        throw new ApolloError('Invalid timeframe', 'BAD_REQUEST');
      }
      const interval = selectedTimeframe[1];

      const query = getRepository(PostScore)
        .createQueryBuilder('postScore')
        .select('postScore.postId', 'postId')
        .addSelect('SUM(score)', 'score')
        .where(`postScore.createdAt > now()::DATE - ${interval} AND postScore.postId IS NOT NULL`)
        .groupBy('postScore.postId')
        .orderBy('score', 'DESC')
        .addOrderBy('postScore.postId', 'DESC')
        .limit(limit);

      if (offset) {
        query.offset(offset);
      }

      const rows = await query.getRawMany();

      console.log(rows);

      const ids = rows.map(row => row.postId);
      const posts = await getRepository(Post).findByIds(ids);
      const normalized = normalize(posts);
      const ordered = ids.map(id => normalized[id]);
      return ordered;
    },
    tag: async (_, tag) => {
      const posts = await getRepository(Tag)
        .createQueryBuilder('tag')
        .leftJoinAndSelect('tag.posts', 'post')
        .where(tag)
        .getMany();

      return posts;
    },
    tags: async () => {
      return await Tag.find({ relations: ['posts'] });
    },
  },
  Mutation: {
    writePost: async (_, { postInput }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const { title, body, tags, imageUrl, seriesId } = postInput;
      console.log('WritePost - tags', tags);
      const post = new Post();
      post.userId = userId;
      post.title = title;
      post.body = body;

      let processedUrlPath = shortid.generate();
      processedUrlPath += `@postId=${v4()}`;

      post.urlPath = processedUrlPath;

      if (tags) {
        post.tags = await Promise.all(tags.map((tag: string) => Tag.create({ tag }).save()));
      }
      if (imageUrl) {
        post.images = await Promise.all(
          imageUrl.map((imageUrl: string) => Image.create({ imageUrl }).save()),
        );
      }
      // Check series

      if (seriesId) {
        const series = await Series.findOne(seriesId);
        if (!series) {
          throw new ApolloError('Series not found', 'NOT_FOUND');
        }
        if (series.userId !== userId) {
          throw new ApolloError('This series is not yours', 'NO_PERMISSION');
        }
      }

      await getRepository(Post).save(post);

      if (seriesId) {
        await appendToSeries(seriesId, post.id);
      }

      return true;
    },
    updatePost: async (_, { id, postInput }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const post = await Post.findOne(id);
      if (!post) {
        throw new ApolloError('Post is not found', 'NOT_FOUND');
      }
      const { title, body, tags, imageUrl } = postInput;
      // const post = new Post();
      post.id = id;
      post.userId = userId;
      post.title = title;
      post.body = body;

      if (tags) {
        const delTag = await Tag.find({ posts: { id } });
        if (delTag.length > 0) {
          console.log('delTag', delTag);
          console.log('delTag', delTag.length);
          await Tag.remove(delTag);
        }
        post.tags = await Promise.all(tags.map((tag: string) => Tag.create({ tag }).save()));
      }
      if (imageUrl) {
        const delImage = await Image.find({ post: { id } });
        if (delImage.length > 0) {
          await Image.remove(delImage);
        }
        post.images = await Promise.all(
          imageUrl.map((imageUrl: string) => Image.create({ imageUrl }).save()),
        );
      }
      await getRepository(Post).save(post);

      return true;
    },
    deletePost: async (_, id, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const tags = await getRepository(Tag).find({
        where: {
          posts: id,
        },
      });
      console.log('tags', tags);
      const post = await Post.delete(id);
      await getConnection()
        .createQueryBuilder()
        .relation(Post, 'tags')
        .of(post)
        .remove(Promise.all(tags.map(tag => Tag.delete(tag.id))));
      return true;
    },
    likePost: async (_, { id }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      // find post
      const postRepo = getRepository(Post);
      const post = await postRepo.findOne(id);
      if (!post) {
        throw new ApolloError('Post not found', 'NOT_FOUND');
      }

      // check already liked
      const alreadyLiked = await PostLike.findOne({ postId: id, userId });

      // // exists
      if (alreadyLiked) {
        return post;
      }
      console.log('postId', id);
      const postLike = new PostLike();
      postLike.userId = userId;
      postLike.postId = id;

      await PostLike.save(postLike);

      const count = await PostLike.count({ postId: id });
      post.likes = count;
      await postRepo.save(post);
      // await Post.update({ id: postId }, { likes: count });

      const score = new PostScore();
      score.type = 'LIKE';
      score.score = 5;
      score.postId = id;
      score.userId = userId;
      await PostScore.save(score);

      return post;
    },
    unlikePost: async (_, { id }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      // find post
      const postRepo = getRepository(Post);
      const post = await postRepo.findOne(id);
      if (!post) {
        throw new ApolloError('Post not found', 'NOT_FOUND');
      }

      // check already liked
      const postLike = await PostLike.findOne({ postId: id, userId });

      // exists
      if (!postLike) {
        return post;
      }

      await PostLike.remove(postLike);

      const count = await PostLike.count({ postId: id });
      post.likes = count;
      await postRepo.save(post);
      // await Post.update({ id: postId }, { likes: count });

      await PostScore.delete({
        postId: id,
        userId,
        type: 'LIKE',
      });
      return post;
    },
    postRead: async (_, { id }, { ip, userId }) => {
      // if (!userId) {
      //   throw new AuthenticationError('Not Logged In');
      // }
      const ipHash = hash(ip);
      console.log('postRead_ipHash:', ipHash);

      const viewed = await createQueryBuilder(PostRead, 'post_read')
        .where('post_read.ipHash = :ipHash', { ipHash })
        .andWhere('post_read.postId = :postId', { postId: id })
        .andWhere("post_read.createdAt > (NOW() - INTERVAL '24 HOURS')")
        .getOne();

      // if (viewed && userId) {
      //   if (!viewed.userId) {
      //     await PostRead.update({ id: viewed.id }, { userId });
      //   }
      //   return false;
      // }
      if (viewed) return false;

      const post = await Post.findOne(id);
      if (!post) return false;

      const postRead = new PostRead();
      postRead.postId = id;
      postRead.ipHash = ipHash;
      if (userId) {
        postRead.userId = userId;
      }
      await PostRead.save(postRead);

      await Post.update({ id }, { viewsCount: post.viewsCount + 1 });
      // await createQueryBuilder(Post, 'post')
      //   .update()
      //   .set({
      //     viewsCount: () => 'viewsCount + 1',
      //   })
      //   .where('id = :id', { id })
      //   .execute();
      if ((post.viewsCount + 1) % 10 === 0) {
        const score = new PostScore();
        score.postId = id;
        score.type = 'READ';
        score.score = 0.75;
        if (userId) {
          score.userId = userId;
        }
        PostScore.save(score);
      }
      return true;
    },
    postSave: async (_, { id }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const post = await Post.findOne(id);
      if (!post) {
        throw new ApolloError('Post not found', 'NOT_FOUND');
      }

      const saved = await PostSave.findOne({ postId: id, userId });
      console.log('saved:', saved);
      if (saved) return false;

      const postSave = new PostSave();
      postSave.userId = userId;
      postSave.postId = id;

      await PostSave.save(postSave);
      return true;
    },
  },
};
