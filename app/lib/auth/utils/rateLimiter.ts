import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]>;
  public config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.requests = new Map();
    this.config = config;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    
    // Check if rate limit is exceeded
    if (recentTimestamps.length >= this.config.maxRequests) {
      return true;
    }
    
    // Add new timestamp
    recentTimestamps.push(now);
    this.requests.set(identifier, recentTimestamps);
    
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const recentTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    return Math.max(0, this.config.maxRequests - recentTimestamps.length);
  }
}

// Create rate limiter instances for different auth endpoints
export const nonceRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 requests
  windowMs: 60 * 1000, // per minute
});

// More restrictive for verification attempts (prevent brute force)
export const verifyRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 verification attempts
  windowMs: 60 * 1000, // per minute
});

// Moderate limits for auth checks (frequent but not abusive)
export const checkRateLimiter = new RateLimiter({
  maxRequests: 30, // 30 requests
  windowMs: 60 * 1000, // per minute
});

// Moderate limits for logout (prevent spam logout)
export const logoutRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
});

// Campaign draft operations (allow frequent saves but prevent abuse)
export const campaignDraftRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requests (1 per second average)
  windowMs: 10 * 1000, // per 10 seconds
});

// Generic rate limit wrapper
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const identifier = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") ||
                      "unknown";
    
    if (rateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(rateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimiter.config.windowMs / 1000).toString()
          }
        }
      );
    }
    return handler(request);
  };
}

// Convenience wrapper for nonce endpoint (backward compatibility)
export function withNonceRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  identifier: string
) {
  return async (request: Request) => {
    if (nonceRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    return handler(request);
  };
} 