import { IRON_OPTIONS } from "@lib/auth/config/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { SignJWT } from "jose";
import { env } from "@lib/auth/config/env";
import { JWT_CONFIG, COOKIE_KEYS } from "@lib/auth/constants";

export async function POST(request: Request) {
  const session = await getIronSession(cookies(), IRON_OPTIONS);
  const { message, signature } = await request.json();

  const siweMessage = new SiweMessage(message);
  const { data: fields } = await siweMessage.verify({ signature });
  console.log("Verifying message with fields:", fields);

  // if (fields.nonce !== session.nonce) {
  //   return NextResponse.json({ message: "Invalid nonce." }, { status: 422 });
  // }

  const jwt = await generateJwt({
    address: fields.address,
    chainId: fields.chainId,
    domain: fields.domain,
    nonce: fields.nonce,
  });

  // Set the JWT cookie with proper settings
  const response = NextResponse.json({ jwt });
  response.cookies.set({
    name: COOKIE_KEYS.JWT,
    value: jwt,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 // 24 hours
  });

  // Also set it in the iron session
  // session.jwt = jwt;
  // await session.save();

  console.log("Setting JWT cookie:", COOKIE_KEYS.JWT);
  return response;
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
