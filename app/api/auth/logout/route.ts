import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { sessionManager } from "@/app/lib/auth/utils/sessionManager";
import mongodb from "@/app/utils/mongodb";
import { withRateLimit, logoutRateLimiter } from "@/app/lib/auth/utils/rateLimiter";
import { securityLogger } from "@/app/lib/auth/utils/securityLogger";

async function logoutHandler(request: Request) {
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
        
        // Log session revocation
        await securityLogger.logSessionRevoked(address, jti, "User logout");
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

// Export POST handler with rate limiting
export const POST = withRateLimit(logoutRateLimiter, logoutHandler);
