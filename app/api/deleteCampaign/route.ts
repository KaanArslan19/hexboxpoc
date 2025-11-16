import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ObjectId } from "mongodb";
import { getPublicCampaign } from "@/app/utils/campaigns";
import { deleteCampaign } from "@/app/utils/poc_utils/deleteCampaign";
import { getProducts } from "@/app/utils/poc_utils/getProducts";
import { deleteProduct } from "@/app/utils/poc_utils/deleteProduct";

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

    const campaign = await getPublicCampaign(campaignId);
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

    if (campaign.status != "draft") {
      return NextResponse.json(
        { success: false, error: "Campaign is configured" },
        { status: 400 }
      );
    }

    const campaign_products = await getProducts(campaignId);
    console.log("Found campaign products:", campaign_products);

    for (const product of campaign_products) {
      const result = await deleteProduct(product.id);
      if (result.success === false) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 400 }
        );
      }
    }
    const result = await deleteCampaign(campaignId);

    if (result.success === false) {
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
