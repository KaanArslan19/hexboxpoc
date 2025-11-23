import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const mdbClient = client;
    const db = mdbClient.db(process.env.HEXBOX_DB);

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "total_raised";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";
    const status = req.nextUrl.searchParams.get("status") || "active";
    const query = req.nextUrl.searchParams.get("query") || "";

    const filterConditions: any = {};

    // Always exclude draft campaigns from public results
    filterConditions.status = { $ne: "draft" };

    if (status && status !== "All") {
      // If a specific status is requested, combine with draft exclusion
      filterConditions.status = { $ne: "draft", $eq: status };
    }

    if (query) {
      filterConditions.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    sortOptions["_id"] = 1;

    console.log(
      `Fetching campaigns with limit: ${limit}, skip: ${skip}, status: ${status}`
    );
    console.log(`Query filter: ${query ? query : "none"}`);
    console.log(`Filter conditions: ${JSON.stringify(filterConditions)}`);
    console.log(`Sort options: ${JSON.stringify(sortOptions)}`);

    const totalCount = await db
      .collection("campaigns")
      .countDocuments(filterConditions);

    console.log(`Total campaigns matching filters: ${totalCount}`);

    const campaigns = await db
      .collection("campaigns")
      .find(filterConditions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`Campaigns returned: ${campaigns.length}`);

    return NextResponse.json({
      campaigns: campaigns,
      total: totalCount,
      limit,
      skip,
    });
  } catch (e) {
    console.error("Error in getCampaigns:", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
