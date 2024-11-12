// api/getCampaigns.js
import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_main");

    // Parse query parameters for limit and skip
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");

    const campaigns = await db
      .collection("campaigns")
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(campaigns);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
