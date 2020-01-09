import { IResolvers } from 'graphql-tools';
import { ApolloContext } from '../../app';
import { Comment } from '../../entity/Comment';
import { getRepository } from 'typeorm';
import { AuthenticationError, ApolloError } from 'apollo-server-koa';
import { Post } from '../../entity/Post';

export const resolvers: IResolvers<any, ApolloContext> = {
  Comment: {
    user: (comment: Comment, __, { loaders }) => {
      if (comment.deleted) {
        return null;
      }
      if (comment.user) return comment.user;
      const user = loaders.user.load(comment.userId);
      return user;
    },
    replies: async (comment: Comment) => {
      if (!comment.hasReplies) return [];
      const comments = await Comment.find({
        where: {
          replyTo: comment.id,
          deleted: false,
        },
        order: {
          createdAt: 'ASC',
        },
      });
      return comments;
    },
  },
  Query: {
    comment: async (_, { id }) => {
      return await Comment.findOne(id);
    },
    subcomments: async (_, { id }) => {
      return await Comment.find({
        where: {
          replyTo: id,
        },
        order: {
          createdAt: 'ASC',
        },
      });
    },
  },

  Mutation: {
    writeComment: async (_, { id, postId, text }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const post = await Post.findOne(postId);
      if (!post) {
        throw new ApolloError('Post not found', 'NOT_FOUND');
      }

      const commentRepo = getRepository(Comment);
      const comment = new Comment();

      if (id) {
        const commentReplyTo = await commentRepo.findOne(id);
        if (!commentReplyTo) {
          throw new ApolloError('Target comment is not found', 'NOT_FOUND');
        }
        comment.level = commentReplyTo.level + 1;
        comment.replyTo = id;
        if (comment.level >= 2) {
          throw new ApolloError('Maximum comment level is 1', 'BAD_REQUEST');
        }
        commentReplyTo.hasReplies = true;
        await commentRepo.save(commentReplyTo);
      }

      comment.text = text;
      comment.postId = postId;
      comment.userId = userId;

      console.log('comment', comment);

      await commentRepo.save(comment);

      return true;
    },
  },
};
