import { NextRequest, NextResponse } from "next/server";
import { getUserOwnedProducts } from "@/app/utils/poc_utils/getUserOwnedProducts";
import { userOwnedProductsRateLimiter } from "@/app/lib/auth/utils/rateLimiter";

export async function GET(req: NextRequest) {
  // Rate limiting check
  const identifier = req.headers.get("x-forwarded-for") || 
                    req.headers.get("x-real-ip") ||
                    req.ip ||
                    "unknown";
  
  if (userOwnedProductsRateLimiter.isRateLimited(identifier)) {
    return NextResponse.json(
      { 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(userOwnedProductsRateLimiter.config.windowMs / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(userOwnedProductsRateLimiter.config.windowMs / 1000).toString()
        }
      }
    );
  }

  const userAddress = req.nextUrl.searchParams.get("userAddress");
  if (!userAddress) {
    return NextResponse.json({ error: "Missing userAddress" }, { status: 400 });
  }
  
  try {
    const data = await getUserOwnedProducts(userAddress);
    return NextResponse.json(data);
  } catch (err) {
    console.error('getUserOwnedProducts error:', err);
    return NextResponse.json(
      { error: "Failed to fetch user products" },
      { status: 500 }
    );
  }
}
