import { getIronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
//import { IRON_OPTIONS } from "@/app/lib/auth/config/session";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { NextRequest } from "next/server";
import { mongoSessionStore } from "@/app/lib/auth/utils/mongoSessionStore";
import { sessionManager } from "@/app/lib/auth/utils/sessionManager";

export async function getServerSideUser(request: NextRequest) {
  try {
    // const session = await getIronSession(cookies(), IRON_OPTIONS);
    // const cookieStore = cookies();
    // console.log(headers().get("cookie"))
    // console.log("Server Side Auth Check:", {
    //   allCookies: cookieStore.getAll().map(c => ({
    //     name: c.name,
    //     path: c.path,
    //     value: c.value ? "exists" : "not set"
    //   })),
    //   sessionJwt: session.jwt ? "exists" : "not set",
    //   jwtCookie: cookieStore.get(COOKIE_KEYS.JWT) ? "exists" : "not found"
    // });

    // Try to get JWT from cookie or session
    console.log(request.cookies.getAll())
    const jwt = request.cookies.get(COOKIE_KEYS.JWT)?.value;

    if (!jwt) {
      console.log("No JWT found in cookie");
      return { address: null, isAuthenticated: false };
    }

    console.log('Verifying JWT...');
    // First verify the JWT with the main secret to get the payload
    const { payload } = await jwtVerify(
      jwt,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );

    const address = payload.address as string;
    const jti = payload.jti as string;

    console.log('JWT verified, payload:', {
      address,
      jti,
      chainId: payload.chainId,
      fullPayload: payload // Log the full payload for debugging
    });

    // Get the session from MongoDB using the jti from the payload
    const session = await mongoSessionStore.getSession(address, jti);
    if (!session) {
      console.log("No session found for JWT. Looking up all sessions for address:", address);
      const allSessions = await mongoSessionStore.getActiveSessions(address);
      console.log("All active sessions for address:", allSessions.map(s => ({
        jti: s.jti,
        status: s.data.status
      })));
      return { address: null, isAuthenticated: false };
    }

    // CRITICAL: Verify the address in the session matches the address in the JWT
    if (session.data.address !== address) {
      console.error('Session hijacking attempt detected:', {
        sessionAddress: session.data.address,
        jwtAddress: address,
        jti
      });
      // Mark the session as compromised
      await sessionManager.revokeSession(address, jti, 'security');
      return { address: null, isAuthenticated: false };
    }

    // CRITICAL: Verify device fingerprint and IP
    const currentDeviceId = sessionManager.generateDeviceId(request);
    const currentIp = request.headers.get('x-forwarded-for') || '';
    
    if (session.data.deviceId !== currentDeviceId || session.data.ip !== currentIp) {
      console.error('Device/IP mismatch detected:', {
        address,
        jti,
        sessionDeviceId: session.data.deviceId,
        currentDeviceId,
        sessionIp: session.data.ip,
        currentIp
      });
      
      // If device/IP changes, require re-authentication
      await sessionManager.revokeSession(address, jti, 'security');
      return { address: null, isAuthenticated: false };
    }

    // Check session status
    if (session.data.status !== 'active') {
      console.log("Session is not active:", session.data.status);
      return { address: null, isAuthenticated: false };
    }

    // Update last active
    session.data.lastActive = Date.now();
    await mongoSessionStore.storeSession(address, jti, session.data);
    
    console.log("Session validation successful:", {
      address: session.data.address,
      chainId: payload.chainId
    });

    return {
      address: session.data.address,
      isAuthenticated: true,
      chainId: payload.chainId as number
    };
  } catch (error) {
    console.error('Error getting server side user:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { address: null, isAuthenticated: false };
  }
} 