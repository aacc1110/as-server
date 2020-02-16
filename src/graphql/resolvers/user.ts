import { IResolvers } from 'graphql-tools';
import { hash, compare } from 'bcryptjs';
import { v4 } from 'uuid';
import shortid from 'shortid';
import { AuthenticationError, ApolloError } from 'apollo-server-koa';

import { setTokens, deleteTokens } from '../../lib/authToken';
import { User } from '../../entity/User';
import { UserProfile } from '../../entity/UserProfile';
import { UserToken } from '../../entity/UserToken';
import { UserEmailConfirm } from '../../entity/UserEmailConfirm';
import sendEmail from '../../lib/sendEmail';
import { createAuthEmail } from '../../lib/emailTemplate';
import { PostSave } from '../../entity/PostSave';
import { getRepository } from 'typeorm';
import { Series } from '../../entity/Series';

export const resolvers: IResolvers = {
  Subscription: {
    addUser: async (_, { id, email }) => {
      return await User.findOne({ id, email }, { relations: ['posts'] });
    },
  },
  User: {
    // posts: async (user: User) => {
    //   const posts = await Post.find({ userId: user.id });
    //   return posts;
    // },
    postSave: async (user: User, __, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      const save = await PostSave.find({ userId: user.id });
      return save;
    },
    seriesList: async (user: User) => {
      const seriesRepo = getRepository(Series);
      const seriesList = await seriesRepo.find({
        where: {
          userId: user.id,
        },
        order: {
          updatedAt: 'DESC',
        },
      });
      return seriesList;
    },
  },
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      return await User.findOne(userId, { relations: ['posts'] });
    },

    user: async (_, { email }) => {
      return await User.findOne({ email }, { relations: ['posts'] });
    },
    users: async () => {
      return await User.find({ relations: ['posts'] });
    },
    userEmailConfirm: async (_, { code }) => {
      const userEmailConfirm = await UserEmailConfirm.findOne({ code });
      if (!userEmailConfirm) {
        throw new ApolloError('User RESISTER CODE is not found', 'NOT_FOUND');
      }
      try {
        userEmailConfirm.confirm = true;
        await userEmailConfirm.save();
      } catch (e) {
        console.log(e);
      }
      return userEmailConfirm;
    },
  },
  Mutation: {
    checkUser: async (_, { email }) => {
      const checkuser = await User.findOne({ email });
      if (!checkuser) return false;
      return true;
    },
    sendEmail: async (_, { email }) => {
      const userEmailConfirm = new UserEmailConfirm();
      userEmailConfirm.code = shortid.generate();
      userEmailConfirm.email = email;
      await userEmailConfirm.save();
      const emailTemplate = createAuthEmail('register', userEmailConfirm.code);

      await sendEmail({
        to: email,
        ...emailTemplate,
        from: 'tadrow@daum.net',
      });
      console.log('email', email);
      return true;
    },

    login: async (_, { email, password }, { ctx }) => {
      /* if (ctx.userId) return null; */
      const user = await User.findOne({ email }, { relations: ['posts'] });
      if (!user) {
        throw new ApolloError('User is not found', 'NOT_FOUND');
      }

      const valid = await compare(password, user.password);
      if (!valid) {
        throw new ApolloError('Password failed', 'PASSWORD_FAILED');
      }

      const tokenId = v4();
      await UserToken.update({ userId: user.id }, { tokenId });

      const token = { user, tokenId };
      const { accessToken, refreshToken } = setTokens(ctx, token);
      console.log(accessToken, refreshToken);
      return {
        accessToken,
        refreshToken,
        tokenId,
        user,
      };
    },
    logout: async (_, __, { ctx, userId }) => {
      if (!userId) {
        throw new ApolloError('User has no unique id value', 'NO_USERID');
      }
      deleteTokens(ctx);
      userId = null;
      console.log('userId', userId);
      return true;
    },

    createMe: async (_, { userInput, userProfileInput }) => {
      try {
        let user = new User();
        user = {
          ...userInput,
        };
        user.userProfile = { ...userProfileInput };
        user.userToken = { ...userInput };

        await User.create(user).save();
      } catch (e) {
        console.error(e);
        return false;
      }
      return true;
    },
    updateMe: async (_, args, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      try {
        const hashedPassword = await hash(args.userInput.password, 10);
        let user = new User();

        user = {
          ...args.userInput,
          password: hashedPassword,
        };
        if (args.userProfileInput) {
          let userProfile = new UserProfile();
          userProfile = {
            ...args.userProfileInput,
          };
          await UserProfile.getRepository().update({ user: userId }, userProfile);
        }
        await User.update(userId, user);
      } catch (e) {
        console.error(e);
        return false;
      }
      return true;
    },
    deleteMe: async (_, { id }, { ctx, userId }) => {
      if (id !== userId || !userId) {
        throw new AuthenticationError('Not Logged In');
      }
      await User.delete(id);
      deleteTokens(ctx);
      return true;
    },
  },
};
