import { Context } from 'koa';
import { IResolvers } from 'graphql-tools';
import bcrypt from 'bcryptjs';

import { User } from '../../entity/User';
import { tokenCreate } from '../../lib/authToken';

export const resolvers: IResolvers = {
  Query: {
    me: async (_, __, ctx: Context) => {
      if (!ctx.body.userId) {
        return null;
      }
      return User.findOne(ctx.body.userId);
    }
  },
  Mutation: {
    logout: async (_, __, ctx: Context) => {
      if (ctx.body.userId) {
        ctx.body = {
          userId: null
        };
      }
      ctx.cookies.set('access-token', undefined, {
        domain: process.env.NODE_ENV === 'development' ? undefined : ''
      });
      ctx.cookies.set('refresh-token', undefined, {
        domain: process.env.NODE_ENV === 'development' ? undefined : ''
      });
      ctx.status = 204;
      return true;
    },
    register: async (_, { email, name, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        name,
        password: hashedPassword
      }).save();
      return true;
    },
    login: async (_, { email, password }, ctx: Context) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return null;
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return null;
      }
      ctx.body = {
        userId: user.id
      };

      tokenCreate(ctx, user);

      return user;
    }
  }
};
