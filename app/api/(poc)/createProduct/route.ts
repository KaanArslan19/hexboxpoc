import { NextRequest, NextResponse } from "next/server";
import {
  createProduct,
  ProductCreationResult,
} from "@/app/utils/poc_utils/createProduct";
import { ethers } from "ethers";
import USDCFundraiserUpgradable from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserUpgradeable.sol/USDCFundraiserUpgradeable.json";
import { getPublicCampaign } from "@/app/utils/campaigns";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import {
  verifyTurnstileToken,
  getClientIp,
} from "@/app/lib/turnstile/verifyTurnstile";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const session = await getServerSideUser(req);
    console.log("Server side session:", session);

    if (!session.isAuthenticated) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWalletAddress = session.address;

    // Check Content-Type header
    const contentType = req.headers.get("content-type") || "";
    let formData;

    try {
      // Only attempt to parse form data if content type is correct
      if (
        contentType.includes("multipart/form-data") ||
        contentType.includes("application/x-www-form-urlencoded")
      ) {
        formData = await req.formData();
      } else {
        return NextResponse.json(
          {
            error: "Invalid Content-Type",
            message:
              "Content-Type must be 'multipart/form-data' or 'application/x-www-form-urlencoded'",
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json(
        {
          error: "Failed to parse form data",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    if (!formData) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 }
      );
    }

    // Validate Turnstile token for bot protection
    const turnstileToken = formData.get("turnstileToken");
    if (!turnstileToken) {
      console.log("Missing Turnstile token in product creation request");
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
      console.log("Invalid Turnstile token in product creation request");
      return NextResponse.json(
        {
          error:
            "Security verification failed. Please refresh the page and try again.",
        },
        { status: 403 }
      );
    }

    console.log("Turnstile verification successful for product creation");

    const campaignId = formData.get("campaignId");
    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaign = await getPublicCampaign(campaignId as string);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.user_id !== creatorWalletAddress) {
      return NextResponse.json(
        {
          error: "You are not authorized to create a product for this campaign",
        },
        { status: 403 }
      );
    }

    // Validate character limits for all product fields
    const characterLimitErrors: Record<string, string> = {};
    const formEntries = Object.fromEntries(formData.entries());
    console.log("Form entries:", formEntries);

    // Stock max limit: 13 characters (1 trillion)
    let stock: any = null;
    try {
      if (formEntries.inventory && typeof formEntries.inventory === "string") {
        console.log("Inventory string:", formEntries.inventory);
        const inventoryObj = JSON.parse(formEntries.inventory);
        stock = inventoryObj?.stock_level;
      }
    } catch (e) {
      console.error("Error parsing inventory:", e);
    }

    if (stock && stock.toString().length > 13) {
      characterLimitErrors.stock = `Stock level exceeds maximum of 13 characters`;
    }

    // Price max limit: 13 characters (1 trillion)
    let price: any = null;
    let gstRate: any = null;
    let gstAmount: any = null;

    try {
      if (formEntries.price && typeof formEntries.price === "string") {
        const priceObj = JSON.parse(formEntries.price);
        price = priceObj?.amount;
        gstRate = priceObj?.gst_rate;
        gstAmount = priceObj?.gst_amount;
      }
    } catch (e) {
      console.error("Error parsing price:", e);
    }

    if (price && price.toString().length > 13) {
      characterLimitErrors.price = `Price exceeds maximum of 13 characters`;
    }

    // GST Rate: 5 characters
    if (gstRate && gstRate.toString().length > 5) {
      characterLimitErrors.gst_rate = `GST rate exceeds maximum of 5 characters`;
    }

    // GST Amount: 5 characters
    if (gstAmount && gstAmount.toString().length > 5) {
      characterLimitErrors.gst_amount = `GST amount exceeds maximum of 5 characters`;
    }

    // Product name max limit: 60 characters
    if (formEntries.name && formEntries.name.toString().length > 60) {
      characterLimitErrors.name = `Product name exceeds maximum of 60 characters`;
    }

    // Manufacturer ID: 60 characters
    if (
      formEntries.manufacturerId &&
      formEntries.manufacturerId.toString().length > 60
    ) {
      characterLimitErrors.manufacturerId = `Manufacturer ID exceeds maximum of 60 characters`;
    }

    // Country of Origin: 60 characters
    if (
      formEntries.countryOfOrigin &&
      formEntries.countryOfOrigin.toString().length > 60
    ) {
      characterLimitErrors.countryOfOrigin = `Country of origin exceeds maximum of 60 characters`;
    }

    // Description: 10000 characters
    if (
      formEntries.description &&
      formEntries.description.toString().length > 10000
    ) {
      characterLimitErrors.description = `Description exceeds maximum of 10000 characters (sent ${
        formEntries.description.toString().length
      } characters)`;
    }

    // Fulfillment details: 1000 characters
    if (
      formEntries.fulfillmentDetails &&
      formEntries.fulfillmentDetails.toString().length > 1000
    ) {
      characterLimitErrors.fulfillmentDetails = `Fulfillment details exceed maximum of 1000 characters (sent ${
        formEntries.fulfillmentDetails.toString().length
      } characters)`;
    }

    // Return Period days: 10 characters, only positive numbers above 0
    let returnPeriod: any = null;
    let returnConditions: any = null;

    try {
      if (
        formEntries.productReturnPolicy &&
        typeof formEntries.productReturnPolicy === "string"
      ) {
        const returnPolicyObj = JSON.parse(formEntries.productReturnPolicy);
        returnPeriod = returnPolicyObj?.return_period_days;
        returnConditions = returnPolicyObj?.conditions;
      }
    } catch (e) {
      console.error("Error parsing return policy:", e);
    }

    if (returnPeriod) {
      if (returnPeriod.toString().length > 10) {
        characterLimitErrors.return_period_days = `Return period exceeds maximum of 10 characters`;
      } else {
        const returnPeriodNum = Number(returnPeriod);
        if (isNaN(returnPeriodNum) || returnPeriodNum <= 0) {
          characterLimitErrors.return_period_days = `Return period must be a positive number greater than 0`;
        }
      }
    }

    // Return conditions: 1000 characters

    if (returnConditions && returnConditions.toString().length > 1000) {
      characterLimitErrors.return_conditions = `Return conditions exceed maximum of 1000 characters`;
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

    // Create product in database first
    const productCreationResult: ProductCreationResult = await createProduct(
      formData
    );

    // Check if product creation returned an error
    if ("error" in productCreationResult) {
      return NextResponse.json(
        { error: productCreationResult.error },
        { status: 500 }
      );
    }

    // Prepare the product data for the blockchain
    const product = {
      productId: BigInt(productCreationResult.productId.toString()),
      price: ethers.parseUnits(productCreationResult.price.toString(), 6),
      supplyLimit: BigInt(productCreationResult.supply.toString()),
    };

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Get the fundraiser contract
    const fundraiserContract = new ethers.Contract(
      campaign.fundraiser_address,
      USDCFundraiserUpgradable.abi,
      provider
    );

    // Encode the function data for addProduct
    const functionData = fundraiserContract.interface.encodeFunctionData(
      "addProduct",
      [product]
    );

    // Construct the transaction
    const transaction = {
      to: campaign.fundraiser_address,
      data: functionData,
      chainId: 43113, // Avalanche Fuji testnet
      value: "0x00",
    };

    return NextResponse.json({
      productId: productCreationResult.productId,
      transaction,
      campaignId: formData.get("campaignId"),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
