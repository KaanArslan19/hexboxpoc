import { NextRequest, NextResponse } from "next/server";

// Request size limits by HTTP method
const SIZE_LIMITS = {
  GET: 1048576,    // 1MB - should be minimal for GET requests
  POST: 10485760,  // 10MB - for file uploads and large data
  PUT: 2097152,    // 2MB - for draft updates with potential file data
  DELETE: 1048576, // 1MB - should be minimal for DELETE requests
  PATCH: 2097152,  // 2MB - for partial updates
} as const;

/**
 * Validates request size based on Content-Length header
 * @param req - NextRequest object
 * @param customLimit - Optional custom size limit in bytes
 * @returns NextResponse with 413 status if request is too large, null if valid
 */
export function validateRequestSize(
  req: NextRequest, 
  customLimit?: number
): NextResponse | null {
  const method = req.method as keyof typeof SIZE_LIMITS;
  const limit = customLimit || SIZE_LIMITS[method] || SIZE_LIMITS.POST;
  
  const contentLength = req.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > limit) {
    const limitMB = (limit / 1048576).toFixed(1);
    const requestMB = (parseInt(contentLength) / 1048576).toFixed(1);
    
    return NextResponse.json(
      { 
        error: "Request payload too large",
        details: {
          limit: `${limitMB}MB`,
          received: `${requestMB}MB`,
          method: method
        }
      }, 
      { status: 413 }
    );
  }
  
  return null; // Request size is valid
}

/**
 * Middleware wrapper for API routes to automatically check request size
 * @param handler - The API route handler function
 * @param customLimit - Optional custom size limit in bytes
 * @returns Wrapped handler with size validation
 */
export function withRequestSizeLimit<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  customLimit?: number
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const sizeError = validateRequestSize(req, customLimit);
    if (sizeError) {
      return sizeError;
    }
    
    return handler(req, ...args);
  };
}

// Export size limits for reference
export { SIZE_LIMITS };
