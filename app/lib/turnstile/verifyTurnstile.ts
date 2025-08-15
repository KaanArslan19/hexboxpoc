// app/lib/turnstile/verifyTurnstile.ts
interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare's API
 * @param token - The Turnstile token to verify
 * @param remoteIp - Optional remote IP address for additional validation
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY environment variable is not set");
      return false;
    }

    if (!token || typeof token !== "string") {
      console.error("Invalid Turnstile token provided");
      return false;
    }

    console.log("Verifying Turnstile token:", token.substring(0, 20) + "...");

    // Prepare form data for Cloudflare verification
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    // Verify with Cloudflare
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      console.error(`Turnstile API error: HTTP ${response.status}`);
      return false;
    }

    const result: TurnstileResponse = await response.json();

    console.log("Turnstile verification result:", {
      success: result.success,
      errorCodes: result["error-codes"],
      timestamp: result.challenge_ts,
    });

    if (result.success) {
      return true;
    } else {
      console.error("Turnstile verification failed:", result["error-codes"]);
      return false;
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

/**
 * Extracts the real IP address from a NextRequest
 * @param request - The NextRequest object
 * @returns string - The client's IP address
 */
export function getClientIp(request: Request): string {
  // Try to get IP from various headers (in order of preference)
  const headers = request.headers;
  
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "127.0.0.1"
  );
}
