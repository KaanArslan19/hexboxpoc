import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  incrementRequestCount,
  decrementRequestCount,
  initializeRateLimitCollection,
} from "@/app/utils/rateLimiting/geoapifyRateLimiter";

// Ensure Node.js runtime for access to process.env and MongoDB driver
export const runtime = "nodejs";

// Read the API key at request time to avoid build-time inlining issues

// Initialize the rate limiting collection on first load
// This creates necessary indexes for efficient queries
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeRateLimitCollection();
    isInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
    // Ensure MongoDB collection is initialized
    await ensureInitialized();

    // Check if we've hit the daily limit using MongoDB
    const rateLimitCheck = await checkRateLimit("geoapify");

    if (!rateLimitCheck.canProceed) {
      console.warn(
        `Geoapify daily limit reached: ${rateLimitCheck.currentCount} requests used`
      );
      return NextResponse.json(
        {
          error:
            "Daily location search limit reached. Please try again tomorrow.",
          limitReached: true,
          usage: {
            used: rateLimitCheck.currentCount,
            remaining: rateLimitCheck.remaining,
          },
        },
        { status: 429 }
      );
    }

    // Check if API key is configured
    if (!GEOAPIFY_API_KEY) {
      console.error("GEOAPIFY_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Location service is not configured" },
        { status: 500 }
      );
    }

    // Get search text from query params
    const searchParams = request.nextUrl.searchParams;
    const text = searchParams.get("text");

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { error: "Search text must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Atomically increment the counter in MongoDB before making the request
    // This handles concurrent requests safely
    const newCount = await incrementRequestCount("geoapify");

    // Make request to Geoapify
    const geoapifyUrl = new URL(
      "https://api.geoapify.com/v1/geocode/autocomplete"
    );
    geoapifyUrl.searchParams.set("text", text);
    geoapifyUrl.searchParams.set("apiKey", GEOAPIFY_API_KEY);
    geoapifyUrl.searchParams.set("limit", "5"); // Limit results to 5
    geoapifyUrl.searchParams.set("format", "json");

    const response = await fetch(geoapifyUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If Geoapify returns an error, decrement our counter in MongoDB
      await decrementRequestCount("geoapify");

      if (response.status === 429) {
        console.error("Geoapify API rate limit hit");
        return NextResponse.json(
          {
            error: "Location service temporarily unavailable",
            limitReached: true,
          },
          { status: 429 }
        );
      }

      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = await response.json();

    // Get updated rate limit info
    const updatedRateLimit = await checkRateLimit("geoapify");

    // Return the results with usage information
    return NextResponse.json({
      success: true,
      results: data.results || [],
      usage: {
        used: updatedRateLimit.currentCount,
        remaining: updatedRateLimit.remaining,
      },
    });
  } catch (error) {
    console.error("Error in Geoapify route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch location suggestions",
      },
      { status: 500 }
    );
  }
}
