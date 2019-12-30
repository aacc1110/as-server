import { IResolvers } from 'graphql-tools';
import 'apollo-cache-control';
import { getConnection, getRepository, getManager, createQueryBuilder } from 'typeorm';
import { AuthenticationError, ApolloError } from 'apollo-server-koa';
import { v4 } from 'uuid';

import { Post } from '../../entity/Post';
import { Tag } from '../../entity/Tag';
import { Image } from '../../entity/Image';
import { Comment } from '../../entity/Comment';
import shortid from 'shortid';
import { escapeForUrl } from '../../lib/utils';
import { User } from '../../entity/User';

export const resolvers: IResolvers = {
  /* Post: {
    user: ({ user }, __, { loader }) => {
      return loader.load(user.id);
    },

    tags: ({ tags }, __, { tagLoader }) => {
      return tagLoader.load(tags.tag);
    }
  }, */
  Query: {
    post: async (_, { id, userEmail, urlPath }) => {
      if (id) {
        // return await Post.findOne({
        //   relations: ['comments'],
        //   where: { id },
        //   order: {
        //     comments: {
        //       id: 'ASC',
        //     },
        //   },
        // });
        const post = await createQueryBuilder(Post, 'post')
          .where('post.id = :id', { id })
          .leftJoinAndSelect('post.comments', 'comment')
          .andWhere('comment.level = 0')
          .andWhere('comment.deleted = false')
          .orderBy({
            'comment.createdAt': 'DESC',
          })
          .getOne();

        return post;
      }
      const post = await createQueryBuilder(Post, 'post')
        .innerJoinAndSelect(User, 'user', 'post.user = user.id')
        .where('post.urlPath = :urlPath AND user.email = :userEmail', { urlPath, userEmail })
        .leftJoinAndSelect('post.comments', 'comment')
        .andWhere('comment.level = 0')
        .andWhere('comment.deleted = false')
        .orderBy({
          'comment.createdAt': 'DESC',
        })
        .getOne();

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
    comment: async (_, id) => {
      return await Comment.findOne(id);
    },
    comments: async (_, { postId }) => {
      console.log(postId);
      return await Comment.find({
        where: { postsId: postId },
        order: { createdAt: 'DESC' },
      });
    },
  },
  Mutation: {
    writePost: async (_, { postInput }, { userId, redis }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const { title, body, tags, imageUrl } = postInput;
      console.log('WritePost - tags', tags);
      const post = new Post();
      post.user = userId;
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
      await getRepository(Post).save(post);

      // await redis.lpush('PostList', JSON.stringify(post));

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
      post.user = userId;
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
        const delImage = await Image.find({ posts: { id } });
        if (delImage.length > 0) {
          await Image.remove(delImage);
        }
        post.images = await Promise.all(
          imageUrl.map((imageUrl: string) => Image.create({ imageUrl }).save()),
        );
      }
      await getRepository(Post).save(post);
      // await getConnection()
      //   .createQueryBuilder()
      //   .relation(Post, 'tags')
      //   .of(post)
      //   .add(tags);

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
    writeComment: async (_, { postId, comment, level }, { userId }) => {
      if (!userId || !postId) return false;

      const comments = new Comment();
      comments.comment = comment;
      comments.level = level;
      comments.postsId = postId;
      comments.userId = userId;

      console.log('comments', comments);

      await getRepository(Comment).save(comments);

      return true;
    },
  },
};
