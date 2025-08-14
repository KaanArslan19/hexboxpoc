import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { withNonceRateLimit } from "@/app/lib/auth/utils/rateLimiter";
import { nonceTracker } from "@/app/lib/auth/utils/nonceTracker";
// Initialize authentication validation (runs once with singleton pattern)
import "@/app/lib/auth/init";

async function generateNonceHandler(request: Request) {
  try {
    // For nonce generation, we don't need an address yet
    // The nonce will be associated with an address during verification
    const address = 'pending'; // Temporary placeholder

    // Generate a cryptographically secure random nonce
    //const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const nonce = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    console.log('Nonce generation: Generated nonce for address:', { address, nonce });
    
    // Store the nonce in MongoDB for later validation
    try {
      await nonceTracker.storeNonce(address, nonce);
      console.log('Nonce generation: Successfully stored nonce in MongoDB');
    } catch (error) {
      console.error('Nonce generation: Failed to store nonce in MongoDB:', error);
      return NextResponse.json(
        { error: "Failed to generate nonce. Please try again." },
        { status: 500 }
      );
    }
    
    // Create a JWT with the actual nonce
    const tempJwt = await new SignJWT({ 
      address,
      nonce: nonce
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

    // Set the nonce as a cookie and return it in the response
    const response = NextResponse.json({ success: true, nonce: nonce });
    
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
  return withNonceRateLimit(generateNonceHandler, identifier)(request);
};

export const POST = (request: Request) => {
  const identifier = request.headers.get("x-forwarded-for") || "unknown";
  return withNonceRateLimit(generateNonceHandler, identifier)(request);
};
