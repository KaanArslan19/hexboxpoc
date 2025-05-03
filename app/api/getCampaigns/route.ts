import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");

    const sortBy = req.nextUrl.searchParams.get("sortBy") || "total_raised";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

    // sort options object with consistent field names
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // unique secondary sort to ensure consistent ordering
    // Using _id as secondary sort ensures each document has a unique sort position
    sortOptions["_id"] = 1;

    console.log(`Fetching campaigns with limit: ${limit}, skip: ${skip}`);
    console.log(`Sort options: ${JSON.stringify(sortOptions)}`);
    console.log(
      `Total campaigns before pagination: ${await db
        .collection("campaigns")
        .countDocuments({})}`
    );

    const campaigns = await db
      .collection("campaigns")
      .find({})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    /* 
    console.log(`Campaigns returned: ${campaigns.length}`);
    if (campaigns.length > 0) {
      console.log(`First campaign _id: ${campaigns[0]?._id}`);
      console.log(`First campaign totalRaised: ${campaigns[0]?.totalRaised}`);
      console.log(`First campaign createdAt: ${campaigns[0]?.createdAt}`);
    } */

    return NextResponse.json(campaigns);
  } catch (e) {
    console.error("Error in getCampaigns:", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
