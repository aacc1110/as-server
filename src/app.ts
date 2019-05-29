import 'reflect-metadata';
import Koa, { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import { ApolloServer } from 'apollo-server-koa';
import { createConnection } from 'typeorm';

import schema from './graphql/schema';
import routes from './routes';
import { createTokens } from './lib/authToken';
import { User } from './entity/User';
import { sign } from 'jsonwebtoken';

const app = new Koa();

/* setup middlewares */
app.use(bodyParser());
app.use(routes.routes()).use(routes.allowedMethods());
if (process.env.NODE_ENV === 'development') {
  app.use(logger());
}

/* const { SECRET_KEY } = process.env;

const refreshToken = sign({ userId: 'user.id', email: 'user.email' }, 'SECRET_KEY', {
  expiresIn: '7d'
});
const accessToken = sign({ userId: 'user.id' }, 'SECRET_KEY', { expiresIn: '1min' });
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  ctx.cookies.set('refresh-token', refreshToken, { httpOnly: true });
  ctx.cookies.set('access-token', accessToken, { httpOnly: true });

  await next();
});
 */
/* 
const startServer = async () => { */
const server = new ApolloServer({
  schema,
  rootValue: true,
  context: ctx => ctx,

  /* async ({ ctx }: { ctx: Context }) => {
    try {
      // await consumeUser(ctx);
      return {
        userId: ctx.state.user.id
      };
    } catch (e) {
      return {};
    }
  }, */
  tracing: process.env.NODE_ENV === 'development'
});

server.applyMiddleware({
  app,
  cors: {
    credentials: true,
    origin: 'http://localhost:5005',
    allowHeaders: ['Content-Type', 'Authorization']
  }
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
/* };
startServer(); */
export default app;
