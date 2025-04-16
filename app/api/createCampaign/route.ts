import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

import { CONTRACTS } from "@/app/utils/contracts/contracts";
import { ethers } from "ethers";
import USDCFundraiserFactory from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserFactory.sol/USDCFundraiserFactory.json";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createDonationProduct } from "@/app/utils/poc_utils/createDonationProduct";
import { ProductCategory } from "@/app/types";
import { log } from "console";
export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const session = await getServerSideUser(req);

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
    console.log("formData-----", formData);

    // Get the logo file from form data
    const logoFile = formData.get("logo") as File;
    if (!logoFile) {
      return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    }
    console.log(logoFile, "logoFile");

    const logoFileName = await uploadImageToR2(logoFile);
    const campaignEntries = Object.fromEntries(formData.entries());
    console.log("campaignEntries----", campaignEntries);

    let campaign = {
      user_id: creatorWalletAddress,
      title: campaignEntries.title,
      description: campaignEntries.description,
      wallet_address: campaignEntries.wallet_address,
      token_address: "",
      logo: logoFileName,
      timestamp: Date.now(),
      status: "active",
      fund_amount: campaignEntries.fund_amount,
      total_raised: 0,
      one_liner: campaignEntries.one_liner,
      social_links: campaignEntries.social_links,
      location: campaignEntries.location,
      deadline:
        typeof campaignEntries.deadline === "string"
          ? Number(campaignEntries.deadline)
          : campaignEntries.deadline,
      is_verified: false,
      factCheck: false,
      funding_type: campaignEntries.funding_type,
      evm_wa: campaignEntries.wallet_address,
      configured: false,
      transactions: [],
    };
    console.log(campaign, "campaign");

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
    const campaignId = result.insertedId.toString();

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Get factory contract interface
    const factoryContract = new ethers.Contract(
      CONTRACTS.USDCFundraiserFactory.fuji,
      USDCFundraiserFactory.abi,
      provider
    );

    /*const productInitialValues: ProductNew = {
      manufacturerId: "",
      name: "",
      type: ProductOrService.ProductOnly,
      countryOfOrigin: "",
      category: { name: ProductCategory.TECH },
      description: "",
      price: {
        amount: 0,
        tax_inclusive: false,
        gst_rate: 0,
        gst_amount: 0,
      },
      inventory: {
        stock_level: 1,
      },
      freeShipping: false,
      productReturnPolicy: {
        eligible: true,
        return_period_days: 30,
        conditions: "",
      },
      campaignId: "",
      userId: "",
      logo: "",
      images: [],
      status: "draft",
      supply: 1,
    };*/

    const donationProduct = new FormData();
    donationProduct.append("isDonationProduct", "true");
    donationProduct.append("manufacturerId", "");
    donationProduct.append("countryOfOrigin", "");
    donationProduct.append("type", "false");
    donationProduct.append("category", "");
    donationProduct.append("logo", logoFile);
    donationProduct.append("description", "");
    const priceString = JSON.stringify({
      amount: 1,
      tax_inclusive: false,
      gst_rate: 0,
      gst_amount: 0,
    });
    donationProduct.append("price", priceString);
    donationProduct.append(
      "inventory",
      JSON.stringify({
        stock_level: 0,
      })
    );
    donationProduct.append("freeShipping", "false");
    donationProduct.append("productReturnPolicy", "false");
    donationProduct.append("status", "available");
    donationProduct.append("images", "");
    donationProduct.append("userId", creatorWalletAddress as string);
    donationProduct.append("campaignId", campaignId);
    donationProduct.append("name", `${campaignEntries.title} Donation`);
    donationProduct.append(
      "description",
      `${campaignEntries.title} Donation product if you want to support the project without purchasing their products/services.`
    );
    donationProduct.append("supply", "0");
    console.log(donationProduct, "donationProduct");
    let productId, price, supply;
    try {
      const result = await createDonationProduct(donationProduct);
      console.log("createProduct completed successfully, result:", result);

      // Destructure the result
      [productId, price, supply] = result;

      // Validate the returned values
      if (!productId || !price || supply === undefined) {
        return NextResponse.json(
          { error: "Invalid product data returned" },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error("Error in createProduct:", e);
      return NextResponse.json(
        { error: e?.toString() || "Unknown error" },
        { status: 500 }
      );
    }

    const products = [
      {
        productId: BigInt(productId.toString()), // Ensure it's a string before converting to BigInt
        price: ethers.parseUnits(price.toString(), 6), // 1 USDC
        supplyLimit: BigInt(0), // Always 0 for donations
      },
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
        products,
      ]
    );

    // Construct the transaction
    const transaction = {
      to: CONTRACTS.USDCFundraiserFactory.fuji,
      data: functionData,
      chainId: 43113, // Avalanche Fuji testnet
      value: "0x00",
    };

    return NextResponse.json({ campaignId, transaction });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
