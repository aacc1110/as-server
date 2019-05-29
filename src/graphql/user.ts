import Koa, { Context } from 'koa';
import { gql, IResolvers } from 'apollo-server-koa';
import bcrypt from 'bcryptjs';

import { User } from '../entity/User';
import { createTokens } from '../lib/authToken';
import { sign } from 'jsonwebtoken';

const app = new Koa();
const { SECRET_KEY } = process.env;

export const typeDef = gql`
  type User {
    id: ID
    email: String
    name: String
    password: String
  }
  type UserProfile {
    id: ID
    thumbnail: String
    about: String
  }
  type Query {
    me: User
  }
  type Mutation {
    register(email: String, name: String, password: String): Boolean
    login(email: String, password: String): User
    logout: Boolean
  }
`;
export const resolvers: IResolvers = {
  Query: {
    me: async (_, args, ctx) => {
      console.log('ctx', ctx);
      /*       if (!ctx.body.user) {
        return null;
      }
      return User.findOne(ctx.body.user.id); */
    }
  },
  Mutation: {
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
        console.log('login failed', user);
        return null;
      }
      const valid = bcrypt.compare(password, user.password);
      if (!valid) {
        return null;
      }
      console.log('userdd', ctx);

      /*       const { refreshToken, accessToken }: any = createTokens(user); */

      if (!SECRET_KEY) return;
      const refreshToken = sign({ userId: user.id, email: user.email }, SECRET_KEY, {
        expiresIn: '1d'
      });
      /* app.use(async (ctx, next) => {
        
        await next();
      }); */
      /*   ctx.cookies.set('access_token', refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
      }); */
      return {
        refreshToken,
        user
      };
    }
  }
};
