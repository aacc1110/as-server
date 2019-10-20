import Router from 'koa-router';
import bcrypt from 'bcryptjs';
import { v4 } from 'uuid';

import { User } from '../entity/User';
import { UserToken } from '../entity/UserToken';
import { sign } from 'jsonwebtoken';

const routes = new Router();

routes.get('/', async ctx => {
  ctx.body = 'hello world';
});

routes.post('/get-token', async ctx => {
  const tokenId = v4();
  console.log('ctx.body', ctx.request.body);
  const { eamil, password } = ctx.request.body;
  const user = await User.findOne(eamil);
  if (!user) return null;

  console.log('usdfsdfsdfser', user);
  await UserToken.update({ userId: user.id }, { tokenId });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  ctx.body = {
    user,
  };
  const { JWT_ACCESSKEY, JWT_REFRESHKEY } = process.env;
  if (!JWT_ACCESSKEY || !JWT_REFRESHKEY) return;

  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_ACCESSKEY,
    {
      expiresIn: '30d', // accessToken will expire in 30days
    },
  );
  ctx.cookies.set('x-token', accessToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 3,
    domain: process.env.NODE_ENV === 'development' ? undefined : '',
  });
  return user;
});

export default routes;
