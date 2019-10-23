import { IResolvers } from 'graphql-tools';
import 'apollo-cache-control';
import { getConnection, getRepository } from 'typeorm';
import { AuthenticationError } from 'apollo-server-koa';

import { Post } from '../../entity/Post';
import { Tag } from '../../entity/Tag';
import { Image } from '../../entity/Image';
import { Comment } from '../../entity/Comment';

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
    post: async (_, id) => {
      return await Post.findOne(id);
    },
    posts: async () => {
      /* info.cacheControl.setCacheHint({ maxAge: 300 }); */
      return await Post.find({
        /*   take: limit, */
        order: {
          createdAt: 'ASC',
        },
      });
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
    writePost: async (_, { title, body, tags, imageUrl }, { userId, redis }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      console.log('WritePost - tags', tags);
      const post = new Post();
      post.user = userId;
      post.title = title;
      post.body = body;
      if (tags) {
        post.tags = await Promise.all(tags.map((tag: any) => Tag.create({ tag }).save()));
      }
      if (imageUrl) {
        post.images = await Promise.all(
          imageUrl.map((imageUrl: any) => Image.create({ imageUrl }).save()),
        );
      }
      await getRepository(Post).save(post);

      // await redis.lpush('PostList', JSON.stringify(post));

      return true;
    },
    updatePost: async (_, { id, title, body, tags }, { userId }) => {
      if (!userId) return false;
      const post = await Post.create({
        user: userId,
        id,
        title,
        body,
      }).save();

      if (tags) {
        const delTag = await Tag.find({ posts: { id } });
        if (delTag.length > 0) {
          console.log('delTag', delTag);
          console.log('delTag', delTag.length);
          await Tag.remove(delTag);
        }
        tags = await Promise.all(tags.map((tag: any) => Tag.create({ tag }).save()));
      }
      await getConnection()
        .createQueryBuilder()
        .relation(Post, 'tags')
        .of(post)
        .add(tags);

      return true;
    },
    deletePost: async (_, id, { userId }) => {
      if (!userId) return false;
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
      comments.posts = postId;
      comments.user = userId;

      console.log('comments', comments);

      await getRepository(Comment).save(comments);

      return true;
    },
  },
};
