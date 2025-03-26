import { getIronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
//import { IRON_OPTIONS } from "@/app/lib/auth/config/session";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";
import { NextRequest } from "next/server";

export async function getServerSideUser(request: NextRequest) {
  try {
    // const session = await getIronSession(cookies(), IRON_OPTIONS);
    // const cookieStore = cookies();
    // console.log(headers().get("cookie"))
    // console.log("Server Side Auth Check:", {
    //   allCookies: cookieStore.getAll().map(c => ({
    //     name: c.name,
    //     path: c.path,
    //     value: c.value ? "exists" : "not set"
    //   })),
    //   sessionJwt: session.jwt ? "exists" : "not set",
    //   jwtCookie: cookieStore.get(COOKIE_KEYS.JWT) ? "exists" : "not found"
    // });

    // Try to get JWT from cookie or session
    console.log(request.cookies.getAll())
    const jwt = request.cookies.get(COOKIE_KEYS.JWT)?.value;

    if (!jwt) {
      console.log("No JWT found in either cookie or session");
      return { address: null, isAuthenticated: false };
    }

    const { payload } = await jwtVerify(
      jwt,
      new TextEncoder().encode(process.env.JWT_SECRET_KEY)
    );
    
    console.log("JWT verification successful:", {
      address: payload.address,
      chainId: payload.chainId
    });

    return {
      address: payload.address as string,
      isAuthenticated: true,
      chainId: payload.chainId as number
    };
  } catch (error) {
    console.error('Error getting server side user:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { address: null, isAuthenticated: false };
  }
} 