'use server';

import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '../constants';

export async function signInAction({ jwt }: { jwt: string }) {
  cookies().set(COOKIE_KEYS.JWT, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

export async function signOutAction() {
  cookies().delete(COOKIE_KEYS.JWT);
}

export async function isAuthAction() {
  try {
    const jwt = cookies().get(COOKIE_KEYS.JWT)?.value;
    return { isAuth: !!jwt };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuth: false };
  }
}
