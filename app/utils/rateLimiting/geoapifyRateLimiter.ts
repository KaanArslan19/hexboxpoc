import client from "@/app/utils/mongodb";

// Configuration
const DAILY_LIMIT = 2900; // Safe buffer below Geoapify free tier (3,000/day)
const DB_NAME = process.env.HEXBOX_DB;
const COLLECTION_NAME = "geoapify_api_usage";

interface ApiUsageDocument {
  service: string; // e.g., "geoapify"
  date: string; // e.g., "2025-10-25"
  requestCount: number;
  lastUpdated: Date;
}

/**
 * Get the current date in YYYY-MM-DD format
 */
function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Initialize the MongoDB collection with proper indexes
 * Call this once during app initialization or first request
 */
export async function initializeRateLimitCollection(): Promise<void> {
  try {
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    // Create compound index on service and date for efficient queries
    await collection.createIndex({ service: 1, date: 1 }, { unique: true });

    // Create TTL index to automatically delete old records after 90 days
    await collection.createIndex(
      { lastUpdated: 1 },
      { expireAfterSeconds: 7776000 }
    ); // 90 days

    console.log("Rate limiting collection initialized successfully");
  } catch (error) {
    console.error("Error initializing rate limit collection:", error);
    // Don't throw - allow app to continue even if indexing fails
  }
}

/**
 * Check if we can make a request (under the daily limit)
 * @param service - The API service name (e.g., "geoapify")
 * @returns Object with canProceed flag and current count
 */
export async function checkRateLimit(
  service: string = "geoapify"
): Promise<{ canProceed: boolean; currentCount: number; remaining: number }> {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    const today = getCurrentDateString();

    // Find the usage document for today
    const usageDoc = await collection.findOne({
      service,
      date: today,
    });

    const currentCount = usageDoc?.requestCount || 0;
    const canProceed = currentCount < DAILY_LIMIT;
    const remaining = Math.max(0, DAILY_LIMIT - currentCount);

    return {
      canProceed,
      currentCount,
      remaining,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // On error, allow the request but log the issue
    return {
      canProceed: true,
      currentCount: 0,
      remaining: DAILY_LIMIT,
    };
  }
}

/**
 * Increment the request counter atomically
 * This uses MongoDB's atomic operations to handle concurrent requests safely
 * @param service - The API service name (e.g., "geoapify")
 * @returns The updated request count
 */
export async function incrementRequestCount(
  service: string = "geoapify"
): Promise<number> {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    const today = getCurrentDateString();

    // Use findOneAndUpdate with $inc for atomic increment
    // This prevents race conditions when multiple requests happen simultaneously
    const result = await collection.findOneAndUpdate(
      { service, date: today },
      {
        $inc: { requestCount: 1 },
        $set: { lastUpdated: new Date() },
        $setOnInsert: {
          service,
          date: today,
        },
      },
      {
        upsert: true, // Create document if it doesn't exist
        returnDocument: "after", // Return the updated document
      }
    );

    const updatedCount = result?.requestCount || 1;

    console.log(
      `[${service}] Request count incremented: ${updatedCount}/${DAILY_LIMIT} (${
        DAILY_LIMIT - updatedCount
      } remaining)`
    );

    return updatedCount;
  } catch (error) {
    console.error("Error incrementing request count:", error);
    throw error;
  }
}

/**
 * Decrement the request counter (used when a request fails)
 * @param service - The API service name (e.g., "geoapify")
 * @returns The updated request count
 */
export async function decrementRequestCount(
  service: string = "geoapify"
): Promise<number> {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    const today = getCurrentDateString();

    // Use atomic decrement, but don't go below 0
    const result = await collection.findOneAndUpdate(
      { service, date: today, requestCount: { $gt: 0 } },
      {
        $inc: { requestCount: -1 },
        $set: { lastUpdated: new Date() },
      },
      {
        returnDocument: "after",
      }
    );

    const updatedCount = result?.requestCount || 0;

    console.log(
      `[${service}] Request count decremented: ${updatedCount}/${DAILY_LIMIT}`
    );

    return updatedCount;
  } catch (error) {
    console.error("Error decrementing request count:", error);
    throw error;
  }
}

/**
 * Get usage statistics for a specific service
 * @param service - The API service name (e.g., "geoapify")
 * @param days - Number of days to retrieve (default: 7)
 */
export async function getUsageStats(
  service: string = "geoapify",
  days: number = 7
): Promise<ApiUsageDocument[]> {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split("T")[0];

    const stats = await collection
      .find({
        service,
        date: { $gte: startDateString },
      })
      .sort({ date: -1 })
      .toArray();

    return stats;
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return [];
  }
}

/**
 * Clean up old usage records (optional, as TTL index handles this automatically)
 * @param daysToKeep - Number of days of history to keep (default: 90)
 */
export async function cleanupOldRecords(
  daysToKeep: number = 90
): Promise<number> {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection<ApiUsageDocument>(COLLECTION_NAME);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateString = cutoffDate.toISOString().split("T")[0];

    const result = await collection.deleteMany({
      date: { $lt: cutoffDateString },
    });

    console.log(`Cleaned up ${result.deletedCount} old usage records`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up old records:", error);
    return 0;
  }
}
