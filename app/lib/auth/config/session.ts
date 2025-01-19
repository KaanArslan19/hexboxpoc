import { SessionOptions } from 'iron-session';

export const IRON_OPTIONS: SessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.JWT_SECRET_KEY || 'complex_password_at_least_32_characters_long',
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    httpOnly: true
  }
};
