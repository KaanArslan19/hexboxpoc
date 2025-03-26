import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { SignJWT } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";

export async function GET() {
  try {
    const nonce = generateNonce();
    console.log("Generated nonce:", nonce);
    
    // Create a temporary JWT with the nonce
    const nonceJwt = await new SignJWT({ nonce })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));

    // Set the nonce cookie with proper settings
    const response = NextResponse.json({ nonce });
    response.cookies.set({
      name: COOKIE_KEYS.NONCE,
      value: nonceJwt,
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5 // 5 minutes
    });

    console.log("Set nonce cookie:", {
      name: COOKIE_KEYS.NONCE,
      value: "exists",
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 300
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
