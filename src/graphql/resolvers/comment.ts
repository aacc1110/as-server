import { IResolvers } from 'graphql-tools';
import { ApolloContext } from '../../app';
import { Comment } from '../../entity/Comment';

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
  },
  Query: {},

  Mutation: {},
};
