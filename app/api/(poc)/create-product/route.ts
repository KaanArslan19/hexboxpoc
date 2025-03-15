import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/app/utils/poc_utils/createProduct";
import { ethers } from "ethers";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { getCampaign } from "@/app/utils/getCampaign";
import { getServerSideUser } from "@/app/utils/getServerSideUser";

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
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.user_id !== creatorWalletAddress) {
      return NextResponse.json({ error: "You are not authorized to create a product for this campaign" }, { status: 403 });
    }

    const [productId, price, supply] = await createProduct(formData);
    const product = {productId: BigInt(productId as string), price: ethers.parseUnits(price.toString(), 6), supplyLimit: BigInt(supply as string)  }
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    const deployer = new ethers.Wallet(
      process.env.DEPLOYER_PRIVATE_KEY!,
      provider
    );

    const fundraiser = new ethers.Contract(
      campaign?.fundraiser_address,
      USDCFundraiser.abi,
      provider
    ).connect(deployer) as unknown as {
      addProduct(
        product: {
          productId: bigint;
          price: bigint;
          supplyLimit: bigint;
        },
        overrides?: { gasLimit: number }
      ): Promise<any>;
      interface: ethers.Interface;
    };

    const hash = await fundraiser.addProduct(product, { gasLimit: 1000000 });
    const receipt = await hash.wait();
    console.log("Transaction sent:", hash);
    console.log("Transaction receipt:", receipt);

    return NextResponse.json({ productId });
    //return NextResponse.json({ productId, price, supply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
