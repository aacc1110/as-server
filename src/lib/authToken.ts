import { Context, Middleware } from 'koa';
import { sign, verify } from 'jsonwebtoken';

import { User } from '../entity/User';
import { UserToken } from '../entity/UserToken';

const { JWT_ACCESSKEY, JWT_REFRESHKEY } = process.env;

export const deleteTokens = (ctx: Context) => {
  ctx.cookies.set('access-token', undefined, {
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
  ctx.cookies.set('refresh-token', undefined, {
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
  ctx.status = 204;
};

export const createTokens = (user: User, tokenId: string) => {
  if (!JWT_ACCESSKEY || !JWT_REFRESHKEY) return;

  const accessToken = sign({ pdi: user.name }, JWT_ACCESSKEY, {
    audience: user.email,
    expiresIn: '30min',
    jwtid: user.id
  });

  const refreshToken = sign({ tokenId }, JWT_REFRESHKEY, {
    expiresIn: '50min',
    jwtid: user.id
  });

  return { refreshToken, accessToken };
};

export const setTokens = (ctx: Context, token: { user: User; tokenId: string }) => {
  const { accessToken, refreshToken }: any = createTokens(token.user, token.tokenId);

  ctx.cookies.set('access-token', accessToken, {
    maxAge: 1000 * 60 * 30,
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });

  ctx.cookies.set('refresh-token', refreshToken, {
    maxAge: 1000 * 60 * 50,
    domain: process.env.NODE_ENV === 'development' ? undefined : ''
  });
};
export const checkToken: Middleware = async (ctx, next) => {
  if (!JWT_ACCESSKEY || !JWT_REFRESHKEY) return;
  const access: string | undefined = ctx.cookies.get('access-token');
  const refresh: string | undefined = ctx.cookies.get('refresh-token');

  if (access) {
    try {
      let decodeToken = verify(access, JWT_ACCESSKEY) as any;
      ctx.state.userId = decodeToken.jti;
      console.log('ctx.state.userId ACCESS', ctx.state.userId);
    } catch (e) {
      console.error(e);
    }
    return next();
  }

  if (!access && refresh) {
    try {
      let decodeToken = verify(refresh, JWT_REFRESHKEY) as any;
      ctx.state.userId = decodeToken.jti;
      console.log('ctx.state.userId REFRESH', ctx.state.userId);

      const userToken: any = await UserToken.findOne({ userId: decodeToken.jti });
      if (!userToken || userToken.tokenId !== decodeToken.tokenId) {
        let count = userToken.faultyCount;
        await UserToken.update({ userId: decodeToken.jti }, { faultyCount: count + 1 });
        deleteTokens(ctx);
        return next();
      }

      const user: any = await User.findOne(decodeToken.jti);
      if (!user) return false;

      const { accessToken, refreshToken }: any = createTokens(user, userToken.tokenId);

      ctx.cookies.set('access-token', accessToken, {
        maxAge: 1000 * 60 * 30,
        domain: process.env.NODE_ENV === 'development' ? undefined : ''
      });

      const diff = decodeToken.exp * 1000 - new Date().getTime();
      if (diff < 1000 * 60 * 40 && refresh) {
        ctx.cookies.set('refresh-token', refreshToken, {
          maxAge: 1000 * 60 * 50,
          domain: process.env.NODE_ENV === 'development' ? undefined : ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  return next();
};
