import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '../constants';
import { mongoSessionStore } from './mongoSessionStore';

export interface SessionData {
  address: string;
  deviceId: string;
  location?: string;
  lastActive: number;
  created: number;
  version: number;
  // Enhanced session details
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  lastIp?: string;
  suspiciousActivity?: boolean;
  status?: 'active' | 'blacklisted' | 'suspended' | 'inactive';
  blacklistReason?: string;
  blacklistedAt?: number;
  deactivatedAt?: number;
  deactivationReason?: 'logout' | 'expired' | 'security';
  [key: string]: string | number | boolean | undefined;
}

interface Session {
  jti: string;
  data: SessionData;
}

class SessionManager {
  private readonly MAX_SESSIONS_PER_ADDRESS = 5;
  private readonly SESSION_VERSION = 1;

  generateDeviceId(request: Request): string {
    // Collect multiple fingerprinting data points
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const accept = request.headers.get('accept') || '';
    const connection = request.headers.get('connection') || '';
    const cacheControl = request.headers.get('cache-control') || '';
    const dnt = request.headers.get('dnt') || '';
    const upgradeInsecureRequests = request.headers.get('upgrade-insecure-requests') || '';
    
    // Get IP with multiple fallbacks
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              request.headers.get('cf-connecting-ip') || 
              'unknown';
    
    // Create comprehensive fingerprint string
    const fingerprintData = [
      userAgent,
      acceptLanguage,
      acceptEncoding, 
      accept,
      connection,
      cacheControl,
      dnt,
      upgradeInsecureRequests,
      ip
    ].join('|');
    
    // Generate cryptographic hash for security and consistency
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(fingerprintData)
      .digest('hex');
    
    // Return first 32 characters for reasonable length
    return hash.substring(0, 32);
  }

  private parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
    // Basic user agent parsing - you might want to use a proper UA parser library
    const ua = userAgent.toLowerCase();
    let browser = 'unknown';
    let os = 'unknown';
    let device = 'desktop';

    if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';

    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('ios')) os = 'ios';

    if (ua.includes('mobile')) device = 'mobile';
    else if (ua.includes('tablet')) device = 'tablet';

    return { browser, os, device };
  }

  private async createSessionToken(data: SessionData, sessionSecret: string): Promise<string> {
    return await new SignJWT(data)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setJti(Math.random().toString(36).substring(2))
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY + sessionSecret));
  }

  async createSession(address: string, request: Request): Promise<{ jwt: string; jti: string }> {
    const deviceId = this.generateDeviceId(request);
    const now = Date.now();
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || '';
    const { browser, os, device } = this.parseUserAgent(userAgent);

    // Generate a unique JTI
    const jti = Math.random().toString(36).substring(2);

    console.log('Creating new session:', {
      address,
      jti
    });

    // Get existing sessions
    const activeSessions = await mongoSessionStore.getActiveSessions(address);

    // Remove oldest session if at limit
    if (activeSessions.length >= this.MAX_SESSIONS_PER_ADDRESS) {
      activeSessions.sort((a, b) => a.data.lastActive - b.data.lastActive);
      const oldestSession = activeSessions.shift();
      if (oldestSession) {
        await mongoSessionStore.removeSession(address, oldestSession.jti);
      }
    }

    // Create session data
    const sessionData: SessionData = {
      address,
      deviceId,
      lastActive: now,
      created: now,
      version: this.SESSION_VERSION,
      ip,
      userAgent,
      browser,
      os,
      device,
      suspiciousActivity: false,
      status: 'active' as const
    };

    // Store in MongoDB first
    console.log('Storing session in MongoDB:', {
      address,
      jti,
      status: sessionData.status
    });

    await mongoSessionStore.storeSession(address, jti, sessionData);

    // Create JWT with the same JTI
    const jwt = await new SignJWT({
      address,
      deviceId,
      lastActive: now,
      created: now,
      version: this.SESSION_VERSION,
      ip,
      userAgent,
      browser,
      os,
      device,
      suspiciousActivity: false,
      status: 'active'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setJti(jti)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

    // Verify the session was stored
    const storedSession = await mongoSessionStore.getSession(address, jti);
    console.log('Session stored successfully:', {
      found: !!storedSession,
      address: storedSession?.data.address,
      jti: storedSession?.jti
    });

    return { jwt, jti };
  }

  async validateSession(token: string): Promise<boolean> {
    if (!process.env.JWT_SECRET_KEY) {
      console.error('JWT_SECRET_KEY is not defined');
      return false;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET_KEY)
      );

      const address = payload.address as string;
      const jti = payload.jti as string;

      // Check if session exists and is active
      const session = await mongoSessionStore.getSession(address, jti);
      console.log('MongoDB: Session lookup result:', {
        found: !!session,
        address: session?.data.address,
        jti: session?.jti,
        status: session?.data.status
      });
      
      if (!session) {
        console.log('Session not found in database');
        return false;
      }

      // CRITICAL: Verify the address in the session matches the address in the JWT
      if (session.data.address !== address) {
        console.error('Session hijacking attempt detected:', {
          sessionAddress: session.data.address,
          jwtAddress: address,
          jti
        });
        // Mark the session as compromised
        await this.revokeSession(address, jti, 'security');
        return false;
      }

      // Note: The JWT has already been verified above with the standard secret
      // No need for additional signature verification as the JWT verification
      // already confirms the token's authenticity

      // Check session status
      if (session.data.status !== 'active') {
        console.log('Session is not active:', session.data.status);
        // Force re-authentication by removing the session
        await this.revokeSession(address, jti, 'security');
        return false;
      }

      // Check version
      if (session.data.version !== this.SESSION_VERSION) return false;

      // Update last active
      session.data.lastActive = Date.now();
      await mongoSessionStore.storeSession(address, jti, session.data);

      return true;
    } catch (error) {
      return false;
    }
  }

  async revokeSession(address: string, jti: string, reason: 'logout' | 'expired' | 'security' = 'logout'): Promise<void> {
    const session = await mongoSessionStore.getSession(address, jti);
    if (session) {
      // Update the existing session data
      const updatedData: SessionData = {
        ...session.data,
        status: 'inactive' as const,
        deactivatedAt: Date.now(),
        deactivationReason: reason
      };
      
      // Store the updated session data
      await mongoSessionStore.storeSession(address, jti, updatedData);
      
      console.log('Session revoked:', {
        address,
        jti,
        reason,
        status: 'inactive'
      });
    }
  }

  async revokeAllSessions(address: string): Promise<void> {
    const sessions = await mongoSessionStore.getActiveSessions(address);
    await Promise.all(sessions.map(session => 
      mongoSessionStore.removeSession(address, session.jti)
    ));
  }

  async blacklistSession(address: string, jti: string, reason: string): Promise<void> {
    const session = await mongoSessionStore.getSession(address, jti);
    if (session) {
      // Update session status to blacklisted
      session.data.status = 'blacklisted';
      session.data.blacklistReason = reason;
      session.data.blacklistedAt = Date.now();
      await mongoSessionStore.storeSession(address, jti, session.data);
    }
  }

  async getActiveSessions(address: string): Promise<Session[]> {
    const sessions = await mongoSessionStore.getActiveSessions(address);
    return sessions.map(session => ({
      jti: session.jti,
      data: session.data
    }));
  }
}

export const sessionManager = new SessionManager(); 