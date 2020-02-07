import 'reflect-metadata';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import { ApolloServer, PubSub } from 'apollo-server-koa';
import { createConnection } from 'typeorm';
import { RedisPubSub } from 'graphql-redis-subscriptions';

import { redis } from './redis';
import schema from './graphql/schema';
import routes from './routes';
import { checkToken } from './lib/authToken';
// import { Loaders } from './lib/DataLoader/createDataLoders';
import createLoaders from './lib/DataLoader/createDataLoders';

const app = new Koa();
const pubsub = new PubSub();

const { REDIS_URL, NODE_ENV } = process.env;
// export type ApolloContext = {
//   userId: string | null;
//   loaders: Loaders;
//   ip: string;
// };
export const startSver = async () => {
  /* setup middlewares */
  if (NODE_ENV === 'development') {
    app.use(logger());
  }
  app.use(bodyParser());
  app.use(checkToken);

  app.use(routes.routes()).use(routes.allowedMethods());

  const pubsubRedis = new RedisPubSub(
    NODE_ENV === 'production'
      ? {
          connection: REDIS_URL as any,
        }
      : {},
  );

  const server = new ApolloServer({
    schema,
    rootValue: true,
    /* cacheControl: {
      defaultMaxAge: 5
    }, */
    context: ({ ctx }) => ({
      ctx,
      userId: ctx.state.userId,
      loaders: createLoaders(),
      ip: ctx.request.ip,
      pubsub,
      /* loader: loader(),
      tagLoader: tagLoader() */
      redis,
      pubsubRedis,
    }),
    tracing: NODE_ENV === 'development',
  });

  server.applyMiddleware({
    app,
    // cors: {
    //   // origin: '*',
    //   origin: 'https://localhost:3000',
    //   credentials: true,
    //   allowHeaders: ['content-type', 'application/json', 'Authorization', 'application/graphql'],
    // },
  });

  async function connectDB() {
    try {
      await createConnection();
      console.log('Postgres RDBMS connection is Success');
    } catch (e) {
      console.error(e);
    }
  }
  connectDB();
  // clear cache
  /* await redis.del('PostList'); */

  // fill cache
  /* function myRedis() {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const posts = await Post.find();
        const postStrings = posts.map(post => JSON.stringify(post));
        if (postStrings.length) {
          await redis.lpush('PostList', ...postStrings);
        }
        console.log(await redis.lrange('PostList', 0, -1));
      }, 300);
    }).catch(err => {
      console.error(err);
    });
  }
  myRedis(); */
};
export default app;
