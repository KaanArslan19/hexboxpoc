import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/app/lib/auth/constants';

export async function GET() {
  try {
    const jwt = cookies().get(COOKIE_KEYS.JWT)?.value;
    
    if (!jwt) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    await jwtVerify(
      jwt,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );

    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
} 