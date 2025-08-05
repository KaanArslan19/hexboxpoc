import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { sessionManager } from "@/app/lib/auth/utils/sessionManager";
import mongodb from "@/app/utils/mongodb";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const jwtCookie = cookieStore.get(COOKIE_KEYS.JWT);

    if (jwtCookie?.value) {
      try {
        const { payload } = await jwtVerify(
          jwtCookie.value,
          new TextEncoder().encode(process.env.JWT_SECRET_KEY)
        );

        const address = payload.address as string;
        const jti = payload.jti as string;

        // Revoke the specific session
        await sessionManager.revokeSession(address, jti);
        console.log("Revoked session:", { address, jti });
        const session = await mongodb.db("hexbox_poc").collection("sessions").findOne({ address: address, jti: jti });
        console.log("Session:", session);
        if (session) {
          await mongodb.db("hexbox_poc").collection("sessions").updateOne({ address: address, jti: jti }, { $set: { status: "inactive" } });
        }
      } catch (error) {
        console.error("Error revoking session:", error);
      }
    }

    // Delete the JWT cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_KEYS.JWT);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
