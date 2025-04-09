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
    
    // Add detailed logging
    console.log("Raw request data:", {
      campaignAddress,
      userAddress,
      productId: {
        value: productId,
        type: typeof productId,
        string: productId.toString()
      },
      quantity: {
        value: quantity,
        type: typeof quantity,
        string: quantity.toString()
      }
    });

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

    // Convert values using different methods to see which works
    const convertedProductId = ethers.parseUnits(productId.toString(), 0);
    const convertedQuantity = ethers.parseUnits(quantity.toString(), 0);

    // Try to get the product first to verify the ID exists
    try {
      const product = await contract.products(convertedProductId);
      console.log("Product from contract:", {
        productId: product[0].toString(),
        price: product[1].toString(),
        supplyLimit: product[2].toString()
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json(
        { error: "Invalid product ID or contract error" },
        { status: 400 }
      );
    }
 
    console.log("Converted values:", {
      productId: {
        original: productId,
        converted: convertedProductId.toString(),
      },
      quantity: {
        original: quantity,
        converted: convertedQuantity.toString(),
      }
    });

    // Try encoding with the converted values
    const txData = contract.interface.encodeFunctionData("deposit", [
      convertedProductId,
      convertedQuantity
    ]);

    console.log("Generated transaction data:", txData);

    return NextResponse.json({
      to: campaignAddress,
      data: txData
    });

  } catch (error) {
    console.error("Error preparing transaction:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
