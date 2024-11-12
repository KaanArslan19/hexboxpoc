import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/auth";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createToken } from "@/app/utils/createToken";
import { createWallet } from "@/app/utils/createWallet";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWalletAddress = session.user?.name;
    console.log(creatorWalletAddress);

    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Campaign data is required" },
        { status: 400 }
      );
    }

    // Get the logo file from form data
    const logoFile = formData.get("logo") as File;
    if (!logoFile) {
      return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    }

    const logoFileName = await uploadImageToR2(logoFile);

    const campaignEntries = Object.fromEntries(formData.entries());
    let campaign = {
      title: campaignEntries.title,
      description: campaignEntries.description,
      hexboxAddress: "",
      logo: logoFileName,
      timestamp: Date.now(),
      status: true,
      tokenUUID: "",
      fund_amount: campaignEntries.fund_amount,
    };
    console.log(campaignEntries.total_supply);
    const totalTokenSupply = Number(campaignEntries.total_supply);

    // Create campaign in DB
    const mdbClient = client;
    const db = mdbClient.db("hexbox_main");
    const result = await db.collection("campaigns").insertOne(campaign);

    console.log(result);
    const campaignId = result.insertedId.toString();

    // Create token
    const tokenUUID = await createToken(campaign.title as string, totalTokenSupply, Number(campaign.fund_amount), creatorWalletAddress as string);
    campaign.tokenUUID = tokenUUID as string;
    console.log(totalTokenSupply, campaign.fund_amount);

    // Create campaign/hexbox wallet here
    const createdWallet = await createWallet(campaign.tokenUUID, campaignId)
    campaign.hexboxAddress = createdWallet as string;

    return NextResponse.json({ campaignId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
