import { IResolvers } from 'graphql-tools';
import { getConnection, getRepository } from 'typeorm';

import { Post } from '../../entity/Post';
import { Context } from 'koa';
import { Tag } from '../../entity/Tag';
import { Image } from '../../entity/Image';
import { Comment } from '../../entity/Comment';

export const resolvers: IResolvers = {
  Query: {
    post: async (_, id) => {
      return await Post.findOne(id);
    },
    posts: async () => {
      return await Post.find();
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
    }
  },
  Mutation: {
    postWrite: async (_, { title, body, tags, image_urls }, ctx: Context) => {
      if (!ctx.userId) return false;
      const post = new Post();
      post.user = ctx.userId;
      post.title = title;
      post.body = body;
      if (tags) {
        post.tags = await Promise.all(tags.map((tag: any) => Tag.create({ tag }).save()));
      }

      if (image_urls) {
        post.images = await Promise.all(
          image_urls.map((image_url: any) => Image.create({ image_url }).save())
        );
      }

      await getRepository(Post).save(post);

      return true;
    },
    postUpdate: async (_, { id, title, body, tags }, ctx: Context) => {
      if (!ctx.userId) return false;
      const post = await Post.create({
        user: ctx.userId,
        id,
        title,
        body
      }).save();
      if (tags) {
        const tagAll = await Promise.all(tags.map((tag: any) => Tag.create({ tag }).save()));

        await getConnection()
          .createQueryBuilder()
          .relation(Post, 'tags')
          .of(post)
          .add(tagAll);
      }

      return true;
    },
    postDelete: async (_, id) => {
      const tags = await getRepository(Tag).find({
        where: {
          posts: [id]
        }
      });
      console.log('tags', tags);

      /* await Promise.all(tags.map(tag => Tag.delete(tag.id))); */
      const post = await Post.delete(id);
      await getConnection()
        .createQueryBuilder()
        .relation(Post, 'tags')
        .of(post)
        .remove(Promise.all(tags.map(tag => Tag.delete(tag.id))));

      /* await getRepository(Post)
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.tags', 'tags')
        .relation(Post, 'tags')
        .delete()
        .where(id)
        .execute(); */
      /* 
            await Post.createQueryBuilder()
              .relation(Post, 'tags')
              .delete()
              .where(id)
              .execute(); */
      return true;
    },
    commentWrite: async (_, { postId, comment, level }) => {
      if (!postId) return false;

      const comments = new Comment();
      comments.comment = comment;
      comments.level = level;
      comments.posts = postId;

      console.log('comments', comments);

      await getRepository(Comment).save(comments);

      return true;
    }
  }
};
