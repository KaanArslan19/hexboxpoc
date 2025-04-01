//import { IRON_OPTIONS } from "@lib/auth/config/session";
//import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@lib/auth/config/env";
import { COOKIE_KEYS, JWT_CONFIG } from "@/app/lib/auth/constants";
import { nonceTracker } from "@/app/lib/auth/utils/nonceTracker";
import { sessionManager } from "@/app/lib/auth/utils/sessionManager";
import { mongoSessionStore } from "@/app/lib/auth/utils/mongoSessionStore";

export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json();
    console.log("Received verification request with message:", message);
    
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });
    console.log("SIWE verification successful, fields:", fields);
    
    // Get the nonce from the cookie
    const cookieStore = cookies();
    const nonceCookie = cookieStore.get(COOKIE_KEYS.NONCE);
    
    console.log("Cookie check:", {
      hasNonceCookie: !!nonceCookie,
      cookieName: COOKIE_KEYS.NONCE,
      cookieValue: nonceCookie?.value ? "exists" : "not found",
      allCookies: cookieStore.getAll().map(c => ({
        name: c.name,
        value: c.value ? "exists" : "not found"
      }))
    });
    
    if (!nonceCookie?.value) {
      console.error("No nonce cookie found");
      return NextResponse.json(
        { error: "No nonce found. Please try connecting again." },
        { status: 401 }
      );
    }

    try {
      // Verify the nonce JWT
      const { payload } = await jwtVerify(
        nonceCookie.value,
        new TextEncoder().encode(process.env.JWT_SECRET_KEY)
      );
      console.log("Nonce JWT verification successful, payload:", payload);

      // Track the nonce usage
      try {
        nonceTracker.addNonce(fields.address, fields.nonce);
      } catch (error) {
        console.error("Nonce tracking error:", error);
        return NextResponse.json(
          { error: "Nonce has already been used. Please try connecting again." },
          { status: 401 }
        );
      }

      // Create a new session
      const { jwt: sessionJwt, jti: sessionJti } = await sessionManager.createSession(fields.address, request);
      
      // Verify the session JWT
      const { payload: sessionPayload } = await jwtVerify(
        sessionJwt,
        new TextEncoder().encode(process.env.JWT_SECRET_KEY)
      );
      
      console.log("Created new session:", { 
        address: fields.address, 
        sessionJti,
        deviceId: sessionPayload.deviceId 
      });

      // Create the main JWT for authentication
      const jwt = await new SignJWT({
        address: fields.address,
        chainId: fields.chainId,
        domain: fields.domain,
        nonce: fields.nonce,
        jti: sessionJti, // Use the extracted JTI
        deviceId: sessionPayload.deviceId // Include device ID for additional security
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer(JWT_CONFIG.ISSUER)
        .setAudience(JWT_CONFIG.AUDIENCE)
        .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

      // Set the JWT cookie and return the JWT in the response
      const response = NextResponse.json({ 
        success: true,
        jwt 
      });
      
      response.cookies.set({
        name: COOKIE_KEYS.JWT,
        value: jwt,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      // Delete the nonce cookie since it's no longer needed
      response.cookies.delete(COOKIE_KEYS.NONCE);

      console.log("Authentication successful:", {
        address: fields.address,
        chainId: fields.chainId,
        domain: fields.domain,
        jti: sessionJti
      });

      return response;
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        { error: "Invalid nonce token. Please try connecting again." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: "Failed to verify signature. Please try connecting again." },
      { status: 401 }
    );
  }
}

async function generateJwt(payload: {
  address: string;
  chainId: number;
  domain: string;
  nonce: string;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.ISSUER)
    .setAudience(JWT_CONFIG.AUDIENCE)
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));
}
