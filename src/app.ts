import 'reflect-metadata';
import Koa, { Context } from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
/* import cookie from 'koa-cookie'; */
import { ApolloServer } from 'apollo-server-koa';
import { createConnection } from 'typeorm';

import schema from './graphql/schema';
import routes from './routes';
import { setTokenCookie } from './lib/authToken';

const app = new Koa();

/* setup middlewares */
app.use(bodyParser());
app.use(setTokenCookie);
/* app.use(cookie()); */
app.use(routes.routes()).use(routes.allowedMethods());
if (process.env.NODE_ENV === 'development') {
  app.use(logger());
}

/* app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  await next();
}); */

/* 
const startServer = async () => { */
const server = new ApolloServer({
  schema,
  rootValue: true,
  formatError: error => {
    console.log(error);
    return error;
  },
  context: ({ ctx }: Context) => {
    return ctx;
  },
  tracing: process.env.NODE_ENV === 'development'
});

server.applyMiddleware({
  cors: {
    credentials: true,
    origin: 'http://localhost:3005',
    allowHeaders: ['Content-Type', 'Authorization']
  },
  app
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
