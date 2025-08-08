import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/app/lib/auth/constants';
import { withRateLimit, checkRateLimiter } from '@/app/lib/auth/utils/rateLimiter';
import { sessionManager } from '@/app/lib/auth/utils/sessionManager';
import { securityLogger } from '@/app/lib/auth/utils/securityLogger';

async function checkHandler(request: Request) {
  try {
    const jwt = cookies().get(COOKIE_KEYS.JWT)?.value;
    
    if (!jwt) {
      return NextResponse.json({ valid: false, reason: 'no_token' }, { status: 401 });
    }

    // Verify JWT signature and extract payload
    const { payload } = await jwtVerify(
      jwt,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );

    const address = payload.address as string;
    const jti = payload.jti as string;

    if (!address || !jti) {
      return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 401 });
    }

    // Validate session exists and is active in database
    const sessionValid = await sessionManager.validateSession(jwt);
    
    if (!sessionValid) {
      console.log('Session validation failed:', { address, jti });
      return NextResponse.json({ 
        valid: false, 
        reason: 'session_invalid',
        message: 'Session has been revoked or expired'
      }, { status: 401 });
    }

    // Session is valid - the validateSession method handles database checks

    return NextResponse.json({ 
      valid: true, 
      address,
      sessionId: jti
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      valid: false, 
      reason: 'verification_failed'
    }, { status: 401 });
  }
}

// Export GET handler with rate limiting
export const GET = withRateLimit(checkRateLimiter, checkHandler); 