import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { SignJWT } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";

export async function GET() {
  try {
    const nonce = generateNonce();
    
    // Create a temporary JWT with the nonce
    const nonceJwt = await new SignJWT({ nonce })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

    // Set the nonce cookie
    const response = NextResponse.json({ nonce });
    response.cookies.set({
      name: COOKIE_KEYS.NONCE,
      value: nonceJwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5 // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}
