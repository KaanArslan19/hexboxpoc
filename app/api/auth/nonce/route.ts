import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { withRateLimit } from "@/app/lib/auth/utils/rateLimiter";
import { nonceTracker } from "@/app/lib/auth/utils/nonceTracker";

async function generateNonceHandler(request: Request) {
  try {
    // For GET requests, use a default address
    // For POST requests, get address from body
    // First, safely try to parse the request body
    let parsedBody;
    if (request.method === 'POST') {
      try {
        parsedBody = await request.json();
      } catch (error) {
        return NextResponse.json({ 
          error: "Invalid request body. Please provide a valid JSON payload.",
          details: error instanceof Error ? error.message : String(error)
        }, { status: 400 });
      }
    }
    const address = request.method === 'GET' 
      ? 'default' 
      : parsedBody.address;
    
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Create a temporary JWT with a placeholder nonce
    // The actual nonce will be verified in the verify route
    const tempJwt = await new SignJWT({ 
      address,
      nonce: "pending" // This will be updated in the verify route
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

    // Set the nonce as a cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: COOKIE_KEYS.NONCE,
      value: tempJwt,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 300 // 5 minutes
    });

    return response;
  } catch (error) {
    console.error("Nonce generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce. Please try again." },
      { status: 500 }
    );
  }
}

// Export both GET and POST handlers with rate limiting
export const GET = (request: Request) => {
  const identifier = request.headers.get("x-forwarded-for") || "unknown";
  return withRateLimit(generateNonceHandler, identifier)(request);
};

export const POST = (request: Request) => {
  const identifier = request.headers.get("x-forwarded-for") || "unknown";
  return withRateLimit(generateNonceHandler, identifier)(request);
};
