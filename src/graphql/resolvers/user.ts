import { Context } from 'koa';
import { IResolvers } from 'graphql-tools';
import bcrypt from 'bcryptjs';

import { User } from '../../entity/User';
import { tokenCreate, deleteTokens } from '../../lib/authToken';
import { UserProfile } from '../../entity/UserProfile';
import { getRepository } from 'typeorm';

export const resolvers: IResolvers = {
  Query: {
    me: async (_, __, ctx: Context) => {
      if (!ctx.userId) return null;
      return User.findOne(ctx.userId, { relations: ['posts'] });
    },
    user: async (_, id) => {
      /* if (!ctx.userId) return null; */
      console.log('id', id);
      return User.findOne(id, { relations: ['posts'] });
    }
  },
  Mutation: {
    createMe: async (_, args) => {
      try {
        let user = new User();
        user = {
          ...args.user
        };
        if (args.userprofile) {
          user.userprofile = { ...args.userprofile };
        }
        await User.create(user).save();
      } catch (err) {
        console.error(err);
        return false;
      }
      return true;
    },
    updateMe: async (_, args, ctx: Context) => {
      try {
        let user = new User();
        user.name = args.name;
        if (args.userprofile) {
          let userprofile = new UserProfile();
          userprofile.mobile = args.mobile;
          userprofile.about = args.about;
          userprofile.thumbnail = args.thumbnail;
          user.userprofile = userprofile;
        }
        await getRepository(User).save(user);
      } catch (err) {
        console.error(err);
        return null;
      }
      return true;
    },
    deleteMe: async (_, id, ctx: Context) => {
      if (id !== ctx.userId) return false;
      deleteTokens(ctx);
      ctx.status = 204;
      await User.delete(id);
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
      /*       ctx.userId = user.id; */

      tokenCreate(ctx, user);

      return user;
    },
    logout: async (_, __, ctx: Context) => {
      if (ctx.userId) {
        ctx.userId = null;
      }
      deleteTokens(ctx);
      return true;
    }
  }
};
