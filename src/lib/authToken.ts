import { sign } from 'jsonwebtoken';

import { User } from '../entity/User';

const { SECRET_KEY } = process.env;
export const createTokens = (user: User) => {
  if (!SECRET_KEY) return;
  const refreshToken = sign({ userId: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: '7d'
  });

  const accessToken = sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1min' });

  return { refreshToken, accessToken };
};
