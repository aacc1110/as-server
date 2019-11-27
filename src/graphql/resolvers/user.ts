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

export const resolvers: IResolvers = {
  Subscription: {
    addUser: async (_, { id, email }) => {
      return await User.findOne({ id, email }, { relations: ['posts'] });
    },
  },
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      return await User.findOne(userId, { relations: ['posts'] });
    },

    user: async (_, { id, email }) => {
      if (!id) {
        throw new ApolloError('Not User ID');
      }
      return await User.findOne({ id, email }, { relations: ['posts'] });
    },
    users: async () => {
      return await User.find({ relations: ['posts'] });
    },
    userEmailConfirm: async (_, { code }) => {
      return await UserEmailConfirm.findOne({ code });
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
      setTokens(ctx, token);
      return {
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
      // const { email } = args.user;
      // const emailConfirm = User.find({ email });
      // if (emailConfirm) {
      //   throw new ApolloError('Unique value email', 'NO_UNIQUE');
      // }
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
