import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    console.log("Delete campaign request received");
    const session = await getServerSideUser(req);
    console.log("Server side session:", session);

    if (!session.isAuthenticated) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWalletAddress = session.address;
    const { campaignId } = await req.json();
    console.log("Received campaignId:", campaignId);

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");

    // Convert string ID to ObjectId
    const objectId = new ObjectId(campaignId);
    console.log("Looking for campaign with ObjectId:", objectId);

    const campaign = await db.collection("campaigns").findOne({
      _id: objectId
    });

    console.log("Found campaign:", campaign);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 400 }
      );
    }

    if (campaign.user_id !== creatorWalletAddress) {
      return NextResponse.json(
        { success: false, error: "Not owner of this campaign" },
        { status: 401 }
      );
    }

    if (campaign.configured == true) {
      return NextResponse.json(
        { success: false, error: "Campaign is configured" },
        { status: 400 }
      );
    }

    const result = await db.collection("campaigns").deleteOne({
      _id: objectId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
} 