import { IResolvers } from 'graphql-tools';
import { Comment } from '../../entity/Comment';
import { getRepository } from 'typeorm';
import { AuthenticationError, ApolloError } from 'apollo-server-koa';
import { Post } from '../../entity/Post';
import { PostScore } from '../../entity/PostScore';

export const resolvers: IResolvers = {
  Comment: {
    user: async (comment: Comment, __, { loaders }) => {
      if (comment.deleted) {
        return null;
      }
      if (comment.user) return comment.user;
      // return await User.findOne(comment.userId);
      return loaders.user.load(comment.userId);
    },
    replies: async (comment: Comment) => {
      if (!comment.hasReplies) return [];
      return await Comment.find({
        where: {
          replyTo: comment.id,
          deleted: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    },
    repliesCount: async (comment: Comment) => {
      console.log('comment.hasReplies', comment.hasReplies);
      if (!comment.hasReplies) return 0;
      return Comment.count({ replyTo: comment.id, deleted: false });
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
          createdAt: 'DESC',
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

      comment.text = text.trim();
      comment.postId = postId;
      comment.userId = userId;

      console.log('comment', comment);

      await commentRepo.save(comment);

      const score = await PostScore.findOne({ postId, userId, type: 'COMMENT' });
      console.log('Isscore:', score);
      if (score) {
        const count = score.score;
        const scoreId = score.id;
        await PostScore.update(scoreId, { score: count + 1 });
      } else {
        console.log('Isscore:', score);
        const newScore = new PostScore();
        newScore.userId = userId;
        newScore.postId = postId;
        newScore.score = 1;
        newScore.type = 'COMMENT';
        await PostScore.save(newScore);
      }

      return true;
    },
    editComment: async (_, { id, text }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }

      const comment = await Comment.findOne(id);
      if (!comment) {
        throw new ApolloError('Comment not founc', 'NOT_FOUND');
      }

      if (userId !== comment.userId) {
        throw new ApolloError('No permission');
      }

      await Comment.update({ id }, { text });
      return true;
    },
    removeComment: async (_, { id, postId }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }

      const comment = await Comment.findOne(id);
      if (!comment) {
        throw new ApolloError('Comment not founc', 'NOT_FOUND');
      }

      if (userId !== comment.userId) {
        throw new ApolloError('No permission');
      }

      comment.deleted = true;
      await Comment.save(comment);

      const score = await PostScore.findOne({ postId, userId, type: 'COMMENT' });
      if (score) {
        const count = score.score;
        const scoreId = score.id;
        await PostScore.update(scoreId, { score: count - 1 });
      } else {
        throw new ApolloError('Not post_score');
      }

      return true;
    },
  },
};
