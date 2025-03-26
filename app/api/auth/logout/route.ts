import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";

export async function GET() {
  try {
    // Delete the JWT cookie
    const response = NextResponse.json({ status: 200 });
    response.cookies.delete(COOKIE_KEYS.JWT);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
