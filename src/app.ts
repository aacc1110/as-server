import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { createConnection } from 'typeorm';
import routes from './routes';

const app = new Koa();

/* setup middlewares */
app.use(bodyParser());

app.use(routes.routes()).use(routes.allowedMethods());

async function connectDB() {
  try {
    await createConnection();
    console.log('Postgres RDBMS connection is Success');
  } catch (e) {
    console.error(e);
  }
}
connectDB();
export default app;
