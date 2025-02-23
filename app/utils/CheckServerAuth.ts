import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";

interface AuthUser {
  address: string | null;
  isAuthenticated: boolean;
  chainId?: number;
}

export async function checkServerAuth(): Promise<AuthUser> {
  try {
    // Use the cookies() function from next/headers
    const cookieStore = cookies();
    const jwt = cookieStore.get(COOKIE_KEYS.JWT)?.value;

    if (!jwt) {
      console.log("No JWT found in cookies");
      return { address: null, isAuthenticated: false };
    }

    const { payload } = await jwtVerify(
      jwt,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );

    console.log("JWT verification successful:", {
      address: payload.address,
      chainId: payload.chainId,
    });

    return {
      address: payload.address as string,
      isAuthenticated: true,
      chainId: payload.chainId as number,
    };
  } catch (error) {
    console.error("Error getting server side user:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { address: null, isAuthenticated: false };
  }
}
