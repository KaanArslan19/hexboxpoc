import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createToken } from "@/app/utils/poc_utils/createToken";
import { createWallet } from "@/app/utils/poc_utils/createWallet";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    /*     const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } */

    const creatorWalletAddress = "session.user?.name;";

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
    console.log("campaignEntries----", campaignEntries);

    let campaign = {
      user_id: creatorWalletAddress,
      title: campaignEntries.title,
      description: campaignEntries.description,
      wallet_address: "",
      token_address: "",
      logo: logoFileName,
      timestamp: Date.now(),
      status: "active",
      fund_amount: campaignEntries.fund_amount,
      one_liner: campaignEntries.one_liner,
      social_links: campaignEntries.social_links,
      location: campaignEntries.location,
      deadline:
        typeof campaignEntries.deadline === "string"
          ? Number(campaignEntries.deadline)
          : campaignEntries.deadline,
      is_verified: false,
      funding_type: campaignEntries.funding_type,
      product_or_service: campaignEntries.product_or_service,
      evm_wa: campaignEntries.wallet_address,
    };

    console.log(campaign);
    const totalTokenSupply = Number(campaignEntries.total_supply);

    // Create token
    const tokenId = await createToken(
      campaign.title as string,
      totalTokenSupply,
      Number(campaign.fund_amount),
      creatorWalletAddress as string
    );
    console.log(tokenId);
    campaign.token_address = tokenId as string;

    // Create campaign/hexbox wallet here
    const createdWallet = await createWallet(tokenId as string);
    console.log(createdWallet);
    campaign.wallet_address = createdWallet as string;

    // Create campaign in DB
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const result = await db.collection("campaigns").insertOne(campaign);
    console.log(result);
    const campaignId = result.insertedId.toString();

    return NextResponse.json({ campaignId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
