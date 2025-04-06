import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/app/utils/poc_utils/createProduct";
import { ethers } from "ethers";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { getCampaign } from "@/app/utils/getCampaign";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { CONTRACTS } from "@/app/utils/contracts/contracts";

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
        { error: "Product data is required" },
        { status: 400 }
      );
    }

    const campaign = await getCampaign(formData.get("campaignId") as string);

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

    // Create product in database first
    const [productId, price, supply] = await createProduct(formData);
    
    // Prepare the product data for the blockchain
    const product = {
      productId: BigInt(productId as string),
      price: ethers.parseUnits(price.toString(), 6),
      supplyLimit: BigInt(supply as string),
    };
    
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Get the fundraiser contract
    const fundraiserContract = new ethers.Contract(
      campaign.fundraiser_address,
      USDCFundraiser.abi,
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
      productId,
      transaction,
      campaignId: formData.get("campaignId")
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
