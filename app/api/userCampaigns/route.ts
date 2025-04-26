import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
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

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "total_raised";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    sortOptions["createdAt"] = -1;

    // Debug logs
    console.log(`Fetching campaigns for userId: ${userId}`);
    console.log(`With limit: ${limit}, skip: ${skip}`);
    console.log(`Sort options: ${JSON.stringify(sortOptions)}`);

    // Count documents matching the userId
    const totalUserCampaigns = await db
      .collection("campaigns")
      .countDocuments({ user_id: userId });

    console.log(
      `Total campaigns for user before pagination: ${totalUserCampaigns}`
    );

    // Find campaigns filtered by userId
    const userCampaigns = await db
      .collection("campaigns")
      .find({ user_id: userId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`Campaigns returned: ${userCampaigns.length}`);

    // Log first campaign details if available
    if (userCampaigns.length > 0) {
      console.log(`First campaign _id: ${userCampaigns[0]?._id}`);
      console.log(
        `First campaign totalRaised: ${userCampaigns[0]?.total_raised}`
      );
    }

    return NextResponse.json({
      campaigns: userCampaigns,
      total: totalUserCampaigns,
      limit,
      skip,
    });
  } catch (e) {
    console.error("Error in getUserCampaigns:", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
