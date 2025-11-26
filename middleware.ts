import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enhanced CSP Policy with Turnstile support
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.rainbow.me https://*.googletagmanager.com https://*.google-analytics.com https://challenges.cloudflare.com https://*.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://*.rainbow.me",
    "img-src 'self' data: https://*.rainbow.me https://*.google-analytics.com https://pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev",
    "connect-src 'self' https://*.rainbow.me https://*.ethereum.org https://*.google-analytics.com https://api.avax-test.network https://api.avax.network https://challenges.cloudflare.com https://*.cloudflare.com https://pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev https://*.walletconnect.org wss://*.walletconnect.org https://o4505397221982208.ingest.us.sentry.io",
    "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");

  // Set the enhanced CSP header
  response.headers.set("Content-Security-Policy", cspPolicy);

  // Debug log for campaign pages
  if (request.nextUrl.pathname.includes("campaign")) {
    console.log("🔒 Applied enhanced CSP for campaign page:", cspPolicy);
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
