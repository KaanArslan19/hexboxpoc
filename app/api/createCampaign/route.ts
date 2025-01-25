import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/auth";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createToken } from "@/app/utils/poc_utils/createToken";
import { createWallet } from "@/app/utils/poc_utils/createWallet";
import { CONTRACTS, CHAIN_IDS } from "@/app/utils/contracts/contracts";
import { ethers } from "ethers";
import USDCFundraiserFactory from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserFactory.sol/USDCFundraiserFactory.json";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";


export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const session = await getServerSideUser(req);
    console.log("Server side session:", session);

    if (!session.isAuthenticated) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWalletAddress = session.address;

    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Campaign data is required" },
        { status: 400 }
      );
    }

    // Get the logo file from form data
    // const logoFile = formData.get("logo") as File;
    // if (!logoFile) {
    //   return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    // }

    const logoFileName = "logo.png"; //await uploadImageToR2(logoFile);
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
      configured: false,
    };

    // console.log(campaign);
    // const totalTokenSupply = Number(campaignEntries.total_supply);

    // // Create token
    // const tokenId = await createToken(
    //   campaign.title as string,
    //   totalTokenSupply,
    //   Number(campaign.fund_amount),
    //   creatorWalletAddress as string
    // );
    // console.log(tokenId);
    // campaign.token_address = tokenId as string;

    // // Create campaign/hexbox wallet here
    // const createdWallet = await createWallet(tokenId as string);
    // console.log(createdWallet);
    // campaign.wallet_address = createdWallet as string;

    // Create campaign in DB
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const result = await db.collection("campaigns").insertOne(campaign);
    console.log(result);
    const campaignId = result.insertedId.toString();

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);

    // Get factory contract interface
    const factoryContract = new ethers.Contract(
      CONTRACTS.USDCFundraiserFactory.fuji,
      USDCFundraiserFactory.abi,
      provider
    );

    const testProducts = [
      {
          productId: 9837413,
          price: 1_000000,     // 1 USDC
          supplyLimit: 100     // Limited to 100
      },
      {
          productId: 7823310,
          price: 2_000000,     // 2 USDC
          supplyLimit: 0       // Unlimited supply
      },
      {
          productId: 6453789,
          price: 3_000000,     // 3 USDC
          supplyLimit: 200     // Limited to 200
      }
  ];

    // Encode the function data
    const functionData = factoryContract.interface.encodeFunctionData(
      "createFundraiser",
      [
        campaign.evm_wa, //placeholder data for beneficiary wallet
        "0xB60c975cC83168C298EfE5334A110DA33618B48d", //placeholder data for fee wallet
        1, //placeholder data for funding type
        ethers.parseUnits(campaign.fund_amount.toString(), 6), //placeholder data for minimum target
        campaignEntries.deadline, //placeholder data for deadline
        testProducts
      ]
    );

    // Construct the transaction
    const transaction = {
      to: CONTRACTS.USDCFundraiserFactory.fuji,
      data: functionData,
      chainId: 43113, // Avalanche Fuji testnet
      value: '0x00'
    };


    return NextResponse.json({ campaignId, transaction });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
