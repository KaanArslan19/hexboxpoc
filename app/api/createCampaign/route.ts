import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/auth";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createToken } from "@/app/utils/createToken";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    // const session = await getServerSession(authOptions)

    // if (!session) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
      fund_amount: Number(campaignEntries.fund_amount),
      hexboxAddress: "",
      logo: logoFileName,
      timestamp: Date.now(),
      status: true,
      totalSupply: 0,
      tokenUUID: "",
    };

    // Create campaign/hexbox wallet here
    // const createdWallet = await createWallet()
    // campaign.hexboxAddress = createdWallet.address

    // Create token
    const tokenUUID = await createToken(campaign.title as string, Number(campaignEntries.totalSupply), campaign.fund_amount as number);
    campaign.tokenUUID = tokenUUID as string;

    // Create campaign in DB
    const mdbClient = client;
    const db = mdbClient.db("hexbox_main");
    const result = await db.collection("campaigns").insertOne(campaign);

    console.log(result);

    return NextResponse.json("created");
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
