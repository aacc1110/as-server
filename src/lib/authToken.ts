import { Context, Middleware } from 'koa';
import { sign, verify } from 'jsonwebtoken';

import { User } from '../entity/User';

const { JWT_ACCESSKEY, JWT_REFRESHKEY } = process.env;

interface TokenData {
  iat: number;
  exp: number;
  sub: string;
  iss: string;
}

type AccessTokenData = {
  userId: string;
  email: string;
  name: string;
} & TokenData;

type RefreshTokenData = {
  userId: string;
} & TokenData;

export const deleteTokens = (ctx: any) => {
  ctx.cookies.set('access-token', undefined, {
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
  ctx.cookies.set('refresh-token', undefined, {
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
  ctx.status = 204;
};

export const createTokens = (user: User) => {
  if (!JWT_ACCESSKEY || !JWT_REFRESHKEY) return;

  const refreshToken = sign({ userId: user.id }, JWT_REFRESHKEY);

  const accessToken = sign({ email: user.email, name: user.name, userId: user.id }, JWT_ACCESSKEY);

  return { refreshToken, accessToken };
};

export function tokenCreate(ctx: Context, user: any) {
  const { refreshToken, accessToken }: any = createTokens(user);
  ctx.cookies.set('access-token', accessToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 1,
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });

  ctx.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 5,
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
}
export const setTokenCookie: Middleware = async (ctx: Context, next) => {
  if (!JWT_ACCESSKEY || !JWT_REFRESHKEY) return;
  let accessToken = ctx.cookies.get('access-token');
  let refreshToken = ctx.cookies.get('refresh-token');

  if (accessToken) {
    try {
      let decodeToken = verify(accessToken, JWT_ACCESSKEY) as any;
      ctx.userId = decodeToken.userId;
    } catch (e) {
      console.error(e);
    }
    return next();
  }

  if (!accessToken && refreshToken) {
    try {
      let decodeToken = verify(refreshToken, JWT_REFRESHKEY) as any;

      const user: any = await User.findOne(decodeToken.userId);

      const { accessToken }: any = createTokens(user);

      ctx.cookies.set('access-token', accessToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 1,
        domain: process.env.NODE_ENV === 'development' ? undefined : ''
      });

      ctx.userId = decodeToken.userId;

      console.log('ctx.userId', ctx.userId);
    } catch (e) {
      console.error(e);
    }
  }
  return next();
};
