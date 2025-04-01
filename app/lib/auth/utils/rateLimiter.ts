import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]>;
  private config: RateLimitConfig;

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

// Create rate limiter instance for nonce generation
export const nonceRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 requests
  windowMs: 60 * 1000, // per minute
});

export function withRateLimit(
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