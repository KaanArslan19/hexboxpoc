import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ethers } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
// Import your contract ABI
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignAddress, userAddress, productId, quantity } = await req.json();
    console.log("Received request:", { campaignAddress, userAddress, productId, quantity });

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Get the contract instance
    const contract = new ethers.Contract(
      campaignAddress,
      USDCFundraiser.abi,
      provider
    );

    const product = await contract.products(productId);
    const productPrice = product[1]

    console.log("Product price:", productPrice);

    // Prepare the transaction data
    console.log("Encoding deposit with:", {
      productId: BigInt(productId),
      quantity: BigInt(quantity)
    });
    
    const txData = contract.interface.encodeFunctionData("deposit", [
      BigInt(productId),
      BigInt(quantity)
    ]);

    console.log("Generated transaction data:", txData);

    return NextResponse.json({
      to: campaignAddress,
      data: txData
    });

  } catch (error) {
    console.error("Error preparing back transaction:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
