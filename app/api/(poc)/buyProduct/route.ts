import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ethers } from "ethers";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignAddress, userAddress, productId, quantity } =
      await req.json();

    // Add detailed logging
    console.log("Raw request data:", {
      campaignAddress,
      userAddress,
      productId: {
        value: productId,
        type: typeof productId,
        string: productId.toString(),
      },
      quantity: {
        value: quantity,
        type: typeof quantity,
        string: quantity.toString(),
      },
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

    // Check if the campaign is finalized
    try {
      console.log("Checking if campaign is finalized...");
      const isFinalized = await contract.finalized();
      console.log("Campaign finalized status:", isFinalized);

      if (isFinalized) {
        console.log("Campaign is finalized, returning error");
        return NextResponse.json(
          {
            error:
              "This campaign has been finalized and is no longer accepting contributions.",
            errorType: "CAMPAIGN_FINALIZED",
          },
          { status: 400 }
        );
      }
    } catch (finalizedError) {
      console.error("Error checking finalized status:", finalizedError);
      return NextResponse.json(
        { error: "Unable to verify campaign status" },
        { status: 500 }
      );
    }

    // Try to get the product to verify the ID exists and check its status
    try {
      const product = await contract.products(convertedProductId);
      console.log("Product from contract:", {
        productId: product[0].toString(),
        price: product[1].toString(),
        supplyLimit: product[2].toString(),
      });

      // Additional check: verify product exists (productId should not be 0)
      if (product[0].toString() === "0") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Check if product has supply limit and if it's exceeded
      const supplyLimit = product[2];
      console.log("Product supply limit:", supplyLimit.toString());

      if (supplyLimit > 0) {
        try {
          const productSoldCount = await contract.productSoldCount(
            convertedProductId
          );
          console.log("Product sold count:", productSoldCount.toString());
          console.log("Requested quantity:", convertedQuantity.toString());
          console.log(
            "Remaining supply:",
            (supplyLimit - productSoldCount).toString()
          );

          if (
            BigInt(productSoldCount) + BigInt(convertedQuantity) >
            BigInt(supplyLimit)
          ) {
            console.log("Insufficient supply - returning error");
            return NextResponse.json(
              {
                error: `Insufficient product supply remaining. Available: ${(
                  supplyLimit - productSoldCount
                ).toString()}, Requested: ${convertedQuantity.toString()}`,
                errorType: "INSUFFICIENT_SUPPLY",
                available: (supplyLimit - productSoldCount).toString(),
                requested: convertedQuantity.toString(),
              },
              { status: 400 }
            );
          }
        } catch (supplyError) {
          console.error("Error checking product supply:", supplyError);
          return NextResponse.json(
            { error: "Unable to verify product supply" },
            { status: 500 }
          );
        }
      }
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
      },
    });

    // Try encoding with the converted values
    const txData = contract.interface.encodeFunctionData("deposit", [
      convertedProductId,
      convertedQuantity,
    ]);

    console.log("Generated transaction data:", txData);

    return NextResponse.json({
      to: campaignAddress,
      data: txData,
    });
  } catch (error) {
    console.error("Error preparing transaction:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        details: "Check server logs for more information",
      },
      { status: 500 }
    );
  }
}
