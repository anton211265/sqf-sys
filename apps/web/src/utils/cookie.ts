import { Token } from 'constants/enum';
import Cookies from 'js-cookie';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cookie security attributes for JWT tokens.
 *
 * - sameSite: 'strict'  — cookies not sent on cross-site requests (CSRF protection)
 * - secure: true in production — cookies only sent over HTTPS
 *
 * Note: httpOnly cannot be set by js-cookie (client-side library). For full
 * httpOnly protection, tokens should be set by the server via Set-Cookie header.
 * This is tracked as a future backend enhancement.
 */
const SECURE_ATTRIBUTES: Cookies.CookieAttributes = {
  sameSite: 'strict',
  secure: isProduction,
  // Access token: short-lived, expires when browser closes
  // Refresh token expiry is set separately below
};

export const saveToken = (token: Token, value: string): void => {
  const attributes: Cookies.CookieAttributes = { ...SECURE_ATTRIBUTES };

  // Refresh token persists for 7 days to match the backend JWT expiry
  if (token === Token.RefreshToken) {
    attributes.expires = 7;
  }

  Cookies.set(token, value, attributes);
};

export const removeToken = (token: Token): void => {
  Cookies.remove(token, { sameSite: 'strict' });
};

export const getToken = (token: Token): string | undefined => {
  return Cookies.get(token);
};
