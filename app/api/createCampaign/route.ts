import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";

import { CONTRACTS } from "@/app/utils/contracts/contracts";
import { ethers } from "ethers";
import USDCFundraiserFactory from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserFactory.sol/USDCFundraiserFactory.json";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { createDonationProduct } from "@/app/utils/poc_utils/createDonationProduct";
import { FundingType, ProductCategory } from "@/app/types";
import {
  verifyTurnstileToken,
  getClientIp,
} from "@/app/lib/turnstile/verifyTurnstile";
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

    // Validate Turnstile token for bot protection
    const turnstileToken = formData.get("turnstileToken");
    if (!turnstileToken) {
      console.log("Missing Turnstile token in campaign creation request");
      return NextResponse.json(
        {
          error:
            "Security verification required. Please complete the verification and try again.",
        },
        { status: 400 }
      );
    }

    // Verify Turnstile token with Cloudflare
    const clientIp = getClientIp(req);
    const isTurnstileValid = await verifyTurnstileToken(
      turnstileToken as string,
      clientIp
    );

    if (!isTurnstileValid) {
      console.log("Invalid Turnstile token in campaign creation request");
      return NextResponse.json(
        {
          error:
            "Security verification failed. Please refresh the page and try again.",
        },
        { status: 403 }
      );
    }

    console.log("Turnstile verification successful for campaign creation");

    // Check for required fields
    const requiredFields = [
      "title",
      "description",
      "wallet_address",
      "fund_amount",
      "one_liner",
      "deadline",
      "funding_type",
      "email",
      "phoneNumber",
      "social_links",
      "location",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData.has(field) || !formData.get(field)
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields: missingFields,
        },
        { status: 400 }
      );
    }

    // Get the logo file from form data
    const logoFile = formData.get("logo") as File;
    if (!logoFile) {
      return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    }
    console.log(logoFile, "logoFile");

    const logoFileName: string | { error: string } = await uploadImageToR2(
      logoFile
    );
    if (typeof logoFileName === "object" && logoFileName.error) {
      return NextResponse.json(
        { error: "Failed to upload logo: " + logoFileName.error },
        { status: 500 }
      );
    }
    const campaignEntries = Object.fromEntries(formData.entries());
    console.log("campaignEntries----", campaignEntries);

    // Sanitize and validate incoming values strictly
    const trimString = (v: unknown): string =>
      typeof v === "string" ? v.trim() : "";

    // Required string fields must be non-empty after trimming
    const requiredStringFields: Array<keyof typeof campaignEntries> = [
      "title",
      "description",
      "wallet_address",
      "one_liner",
      "location",
      "email",
      "phoneNumber",
    ];

    for (const field of requiredStringFields) {
      const value = trimString(campaignEntries[field]);
      if (!value) {
        return NextResponse.json(
          { error: `${String(field)} is required` },
          { status: 400 }
        );
      }
      // put back trimmed value
      (campaignEntries as any)[field] = value;
    }

    // Validate wallet address format (EVM)
    const walletAddress = String(campaignEntries.wallet_address);
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Wallet address must be a valid EVM address" },
        { status: 400 }
      );
    }

    // Validate and coerce fund_amount
    const rawFundAmount = campaignEntries.fund_amount;
    const fundAmountNumber = Number(
      typeof rawFundAmount === "string" ? rawFundAmount.trim() : rawFundAmount
    );
    if (!Number.isFinite(fundAmountNumber) || fundAmountNumber <= 0) {
      return NextResponse.json(
        { error: "Fund amount must be a positive number" },
        { status: 400 }
      );
    }
    // limit to safe bounds (<= 1 trillion)
    if (fundAmountNumber > 1_000_000_000_000) {
      return NextResponse.json(
        { error: "Fund amount exceeds maximum allowed" },
        { status: 400 }
      );
    }

    // Validate funding type
    const fundingType = String(campaignEntries.funding_type);
    const allowedFundingTypes = [
      "AllOrNothing",
      "Limitless",
      "Flexible",
    ] as const;
    if (!allowedFundingTypes.includes(fundingType as any)) {
      return NextResponse.json(
        { error: "Invalid funding type" },
        { status: 400 }
      );
    }

    // Parse and validate social links JSON into object with string or empty values
    let socialLinksObj: any = {};
    try {
      const raw = campaignEntries.social_links;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === "object") {
        socialLinksObj = {
          website: trimString(parsed.website) || "",
          discord: trimString(parsed.discord) || "",
          telegram: trimString(parsed.telegram) || "",
          linkedIn: trimString(parsed.linkedIn) || "",
        };
      } else {
        socialLinksObj = {
          website: "",
          discord: "",
          telegram: "",
          linkedIn: "",
        };
      }
    } catch (_e) {
      return NextResponse.json(
        { error: "Invalid social links format" },
        { status: 400 }
      );
    }

    // Validate character limits for all campaign fields
    const characterLimitErrors: Record<string, string> = {};

    // Fundraising amount max limit: 13 characters
    if (
      campaignEntries.fund_amount &&
      campaignEntries.fund_amount.toString().length > 13
    ) {
      characterLimitErrors.fund_amount = `Fundraising amount exceeds maximum of 13 characters`;
    }

    // Campaign Title max limit: 60 characters
    if (campaignEntries.title && campaignEntries.title.toString().length > 60) {
      characterLimitErrors.title = `Title exceeds maximum of 60 characters`;
    }

    // One-liner max characters: 80 characters
    if (
      campaignEntries.one_liner &&
      campaignEntries.one_liner.toString().length > 80
    ) {
      characterLimitErrors.one_liner = `One-liner exceeds maximum of 80 characters`;
    }

    // Description max characters: 10000 characters
    if (
      campaignEntries.description &&
      campaignEntries.description.toString().length > 10000
    ) {
      characterLimitErrors.description = `Description exceeds maximum of 10000 characters`;
    }

    // Campaign location: 60 characters
    if (
      campaignEntries.location &&
      campaignEntries.location.toString().length > 60
    ) {
      characterLimitErrors.location = `Location exceeds maximum of 60 characters`;
    }

    // Email: 60 characters
    if (campaignEntries.email && campaignEntries.email.toString().length > 60) {
      characterLimitErrors.email = `Email exceeds maximum of 60 characters`;
    }

    // Phone number: 18 characters (max phone number is 15 digits in the world)
    if (
      campaignEntries.phoneNumber &&
      campaignEntries.phoneNumber.toString().length > 18
    ) {
      characterLimitErrors.phoneNumber = `Phone number exceeds maximum of 18 characters`;
    }

    // Wallet address: 42 characters, EVM format
    if (campaignEntries.wallet_address) {
      const walletAddress = campaignEntries.wallet_address.toString();
      if (walletAddress.length > 42) {
        characterLimitErrors.wallet_address = `Wallet address exceeds maximum of 42 characters`;
      } else if (
        !walletAddress.startsWith("0x") ||
        !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)
      ) {
        characterLimitErrors.wallet_address = `Wallet address must be in EVM format (0x followed by 40 hexadecimal characters)`;
      }
    }

    // Validate social links if they exist
    if (campaignEntries.social_links) {
      let socialLinks;
      try {
        // Check if social_links is already an object or needs to be parsed
        socialLinks =
          typeof campaignEntries.social_links === "string"
            ? JSON.parse(campaignEntries.social_links)
            : campaignEntries.social_links;

        // Website URL: 100 characters
        if (
          socialLinks.website &&
          socialLinks.website.toString().length > 100
        ) {
          characterLimitErrors[
            "social_links.website"
          ] = `Website URL exceeds maximum of 100 characters`;
        }

        // Discord URL: 100 characters
        if (
          socialLinks.discord &&
          socialLinks.discord.toString().length > 100
        ) {
          characterLimitErrors[
            "social_links.discord"
          ] = `Discord URL exceeds maximum of 100 characters`;
        }

        // Telegram URL: 100 characters
        if (
          socialLinks.telegram &&
          socialLinks.telegram.toString().length > 100
        ) {
          characterLimitErrors[
            "social_links.telegram"
          ] = `Telegram URL exceeds maximum of 100 characters`;
        }

        // LinkedIn URL: 100 characters
        if (
          socialLinks.linkedin &&
          socialLinks.linkedin.toString().length > 100
        ) {
          characterLimitErrors[
            "social_links.linkedin"
          ] = `LinkedIn URL exceeds maximum of 100 characters`;
        }
      } catch (e) {
        console.error("Error parsing social_links:", e);
        characterLimitErrors.social_links = `Invalid social links format`;
      }
    }

    // Return all character limit errors if any field exceeds its limit
    if (Object.keys(characterLimitErrors).length > 0) {
      return NextResponse.json(
        {
          error: "Character limit exceeded for one or more fields",
          fields: characterLimitErrors,
        },
        { status: 400 }
      );
    }

    // Validate and convert the deadline to Unix seconds format
    let deadlineInSeconds: number;
    const rawDeadline = campaignEntries.deadline;
    console.log("rawDeadline", rawDeadline);

    if (typeof rawDeadline === "string") {
      const deadlineNum = Number(rawDeadline);
      if (isNaN(deadlineNum)) {
        return NextResponse.json(
          { error: "Deadline must be a valid number" },
          { status: 400 }
        );
      }
      deadlineInSeconds = deadlineNum;
    } else if (typeof rawDeadline === "number") {
      deadlineInSeconds = rawDeadline;
    } else {
      return NextResponse.json(
        { error: "Deadline must be provided as a number" },
        { status: 400 }
      );
    }

    // Convert from milliseconds to seconds if needed
    // Date.parse() returns milliseconds, but we need seconds for the contract
    console.log("first deadlineInSeconds", deadlineInSeconds);
    if (deadlineInSeconds > 10000000000) {
      // If deadline is in milliseconds (13+ digits), convert to seconds
      deadlineInSeconds = Math.floor(deadlineInSeconds / 1000);
    }
    console.log("second deadlineInSeconds", deadlineInSeconds);

    // Ensure the deadline is in the future
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    if (deadlineInSeconds <= currentTimeInSeconds) {
      return NextResponse.json(
        { error: "Deadline must be in the future" },
        { status: 400 }
      );
    }

    let campaign = {
      user_id: creatorWalletAddress,
      title: trimString(campaignEntries.title),
      description: trimString(campaignEntries.description),
      wallet_address: walletAddress,
      token_address: "",
      logo: logoFileName,
      timestamp: Date.now(),
      status: "draft",
      fund_amount: fundAmountNumber,
      total_raised: 0,
      one_liner: trimString(campaignEntries.one_liner),
      social_links: socialLinksObj,
      location: trimString(campaignEntries.location),
      deadline: deadlineInSeconds,
      is_verified: false,
      factCheck: false,
      funding_type: fundingType,
      configured: false,
      transactions: [],
      email: trimString(campaignEntries.email),
      phoneNumber: trimString(campaignEntries.phoneNumber),
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

    let chosenFundingType = 0;
    if (campaignEntries.funding_type === "AllOrNothing") {
      chosenFundingType = 0;
    } else if (campaignEntries.funding_type === "Limitless") {
      chosenFundingType = 1;
    } else if (campaignEntries.funding_type === "Flexible") {
      chosenFundingType = 2;
    }

    // Encode the function data
    const functionData = factoryContract.interface.encodeFunctionData(
      "createFundraiser",
      [
        campaign.wallet_address,
        chosenFundingType,
        ethers.parseUnits(campaign.fund_amount.toString(), 6),
        campaign.deadline,
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
