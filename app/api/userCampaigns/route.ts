import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { userCampaignsRateLimiter } from "@/app/lib/auth/utils/rateLimiter";
import { isValidEthAddress } from "@/app/utils/poc_utils/isValidEthAddress";

// Define the Campaign interface for type safety
interface Campaign {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  wallet_address: string;
  logo?: string;
  timestamp: number;
  status: string;
  fund_amount: number;
  total_raised: number;
  one_liner?: string;
  social_links?: any;
  location?: string;
  deadline?: number;
  is_verified?: boolean;
  factCheck?: any;
  funding_type?: string;
  evm_wa?: string;
  configured?: boolean;
  transactions?: any[];
  fundraiser_address?: string;
  last_synced?: number;
  comments?: any[];
}

export const GET = async (req: NextRequest) => {
  try {
    // Rate limiting check
    const identifier = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") ||
                      req.ip ||
                      "unknown";
    
    if (userCampaignsRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(userCampaignsRateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(userCampaignsRateLimiter.config.windowMs / 1000).toString()
          }
        }
      );
    }

    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");

    // Extract userId from query parameters
    const userId = req.nextUrl.searchParams.get("userId");

    // If no userId is provided, return an error
    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    if (!isValidEthAddress(userId)) {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "10"), 1), 100);
    const skip = Math.max(parseInt(req.nextUrl.searchParams.get("skip") || "0"), 0);
    
    // Whitelist allowed sort fields to prevent NoSQL injection
    const allowedSortFields = ['total_raised', 'createdAt', 'deadline', 'fund_amount', 'timestamp', 'status'];
    const requestedSortBy = req.nextUrl.searchParams.get("sortBy");
    const sortBy = requestedSortBy && allowedSortFields.includes(requestedSortBy) ? requestedSortBy : "total_raised";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    sortOptions["createdAt"] = -1;

    // Debug logs
    console.log(`Fetching campaigns for userId: ${userId}`);
    console.log(`With limit: ${limit}, skip: ${skip}`);
    console.log(`Sort options: ${JSON.stringify(sortOptions)}`);

    // Use aggregation pipeline for single query optimization
    const pipeline = [
      { $match: { user_id: userId } },
      { $sort: sortOptions },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          count: [{ $count: "total" }]
        }
      }
    ];

    const [result] = await db.collection("campaigns").aggregate(pipeline).toArray();
    const userCampaigns: Campaign[] = result.data || [];
    const totalUserCampaigns = result.count[0]?.total || 0;

    console.log(`Total campaigns for user: ${totalUserCampaigns}`);
    console.log(`Campaigns returned: ${userCampaigns.length}`);

    // Log first campaign details if available
    if (userCampaigns.length > 0) {
      console.log(`First campaign _id: ${userCampaigns[0]?._id}`);
      console.log(
        `First campaign totalRaised: ${userCampaigns[0]?.total_raised}`
      );
    }

    // Apply censorship to campaign data (remove sensitive fields)
    const censoredCampaigns = userCampaigns.map(campaign => ({
      "_id": campaign._id,
      "user_id": campaign.user_id,
      "title": campaign.title,
      "description": campaign.description,
      "wallet_address": campaign.wallet_address,
      "logo": campaign.logo,
      "timestamp": campaign.timestamp,
      "status": campaign.status,
      "fund_amount": campaign.fund_amount,
      "total_raised": campaign.total_raised,
      "one_liner": campaign.one_liner,
      "social_links": campaign.social_links,
      "location": campaign.location,
      "deadline": campaign.deadline,
      "is_verified": campaign.is_verified,
      "factCheck": campaign.factCheck,
      "funding_type": campaign.funding_type,
      "evm_wa": campaign.evm_wa,
      "configured": campaign.configured,
      "transactions": campaign.transactions,
      "fundraiser_address": campaign.fundraiser_address,
      "last_synced": campaign.last_synced,
      "comments": campaign.comments,
    }));

    return NextResponse.json({
      campaigns: censoredCampaigns,
      total: totalUserCampaigns,
      limit,
      skip,
    });
  } catch (e) {
    console.error("Error in getUserCampaigns:", e);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
};
