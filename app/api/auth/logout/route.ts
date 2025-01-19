import { IRON_OPTIONS } from "@lib/auth/config/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getIronSession<{ nonce: string }>(
    cookies(),
    IRON_OPTIONS
  );
  console.log(session);

  await session.destroy();

  return NextResponse.json({ status: 200 });
}
