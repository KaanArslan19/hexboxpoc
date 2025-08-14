import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { uploadImageToR2 } from "@/app/utils/imageUpload";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId || !ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Campaign data is required" },
        { status: 400 }
      );
    }

    const db = client.db("hexbox_poc");
    const existingCampaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    let updatedFields: any = {};

    updatedFields.title = formData.get("title") as string;
    updatedFields.email = formData.get("email") as string;
    updatedFields.phoneNumber = formData.get("phoneNumber") as string;
    updatedFields.description = formData.get("description") as string;
    updatedFields.location = formData.get("location") as string;
    updatedFields.fund_amount = formData.get("fund_amount") as string;

    const oneLiner = formData.get("one_liner");
    if (oneLiner) {
      updatedFields.one_liner = oneLiner as string;
    }

    const fundingType = formData.get("funding_type");
    if (fundingType) {
      updatedFields.funding_type = fundingType as string;
    }

    const productOrService = formData.get("product_or_service");
    if (productOrService) {
      updatedFields.product_or_service = productOrService as string;
    }

    const walletAddress = formData.get("wallet_address");
    if (walletAddress) {
      updatedFields.wallet_address = walletAddress as string;
    }

    const deadlineStr = formData.get("deadline") as string;
    if (deadlineStr) {
      // Convert from milliseconds to seconds for storage
      const deadlineInMilliseconds = Number(deadlineStr);
      updatedFields.deadline = Math.floor(deadlineInMilliseconds / 1000);
      console.log("Deadline stored (seconds):", updatedFields.deadline);
    } else {
      updatedFields.deadline = existingCampaign.deadline;
    }

    const socialLinksStr = formData.get("social_links") as string;
    if (socialLinksStr) {
      try {
        updatedFields.social_links = JSON.parse(socialLinksStr);
      } catch (e) {
        console.error("Error parsing social links:", e);
        updatedFields.social_links = existingCampaign.social_links;
      }
    }

    const logoFile = formData.get("logo") as File;
    if (logoFile && logoFile instanceof File) {
      const newLogoFileName = await uploadImageToR2(logoFile);
      updatedFields.logo = newLogoFileName;
    } else {
      updatedFields.logo = existingCampaign.logo;
    }

    console.log("Updating campaign with fields:", updatedFields);

    const result = await db
      .collection("campaigns")
      .updateOne({ _id: new ObjectId(campaignId) }, { $set: updatedFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Campaign updated successfully",
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
