import { IResolvers } from 'graphql-tools';
import { hash, compare } from 'bcryptjs';
import { v4 } from 'uuid';

import { User } from '../../entity/User';
import { setTokens, deleteTokens } from '../../lib/authToken';
import { UserProfile } from '../../entity/UserProfile';
import { UserToken } from '../../entity/UserToken';

export const resolvers: IResolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) return null;
      return await User.findOne(userId, { relations: ['posts'] });
    },
    user: async (_, id, { userId }) => {
      if (!userId) return null;
      return await User.findOne(id, { relations: ['posts'] });
    },
    users: async () => {
      return await User.find({ relations: ['posts'] });
    }
  },
  Mutation: {
    createMe: async (_, args) => {
      try {
        let user = new User();
        user = {
          ...args.user
        };
        user.userprofile = { ...args.userprofile };
        user.usertoken = { ...args.usertoken };

        await User.create(user).save();
      } catch (e) {
        console.error(e);
        return false;
      }
      return true;
    },
    updateMe: async (_, args, { userId }) => {
      if (!userId) return false;
      try {
        const hashedPassword = await hash(args.user.password, 10);
        console.log('...args.userprofile', args.userprofile);
        /*         let profile = new UserProfile();
                profile = {
                  ...args.userprofile,
                  user: { ...args.user }
                }; */
        let user = new User();
        user = {
          ...args.user,
          password: hashedPassword
        };
        if (args.userprofile) {
          let userprofile = new UserProfile();
          userprofile = {
            ...args.userprofile
          };
          await UserProfile.update({ user: userId }, userprofile);
        }
        await User.update(userId, user);
      } catch (e) {
        console.error(e);
        return false;
      }
      return true;
    },
    deleteMe: async (_, args, { ctx, userId }) => {
      if (args.id !== userId || !userId) return false;
      await User.delete(args.id);
      deleteTokens(ctx);
      return true;
    },
    login: async (_, { email, password }, { ctx }) => {
      /* if (ctx.userId) return null; */
      const tokenId = v4();
      const user = await User.findOne({ where: { email } });
      if (!user) return null;

      await UserToken.update({ userId: user.id }, { tokenId });

      const valid = await compare(password, user.password);
      if (!valid) return null;

      const token = { user, tokenId };
      setTokens(ctx, token);
      return {
        /* accessToken, */
        user
      };
    },
    logout: async (_, __, { ctx, userId }) => {
      if (userId) {
        ctx.state.userId = null;
      }
      deleteTokens(ctx);
      return true;
    }
  }
};
