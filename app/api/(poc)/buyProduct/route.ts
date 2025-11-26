import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ethers } from "ethers";
import USDCFundraiserUpgradable from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserUpgradeable.sol/USDCFundraiserUpgradeable.json";
import { isAddressValidCampaign } from "@/app/utils/poc_utils/isAddressValidCampaign";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, safely try to parse the request body
    let parsedBody;
    try {
      parsedBody = await req.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid request body. Please provide a valid JSON payload.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      );
    }

    // Now that we've safely parsed the body, validate required fields
    const { campaignAddress, productId, quantity } = parsedBody;

    if (!campaignAddress || productId === undefined || quantity === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Required fields: campaignAddress, productId, quantity",
        },
        { status: 400 }
      );
    }

    // Log the parsed data for debugging
    console.log("Received request data:", parsedBody);

    const isValidCampaign = await isAddressValidCampaign(campaignAddress);
    if (!isValidCampaign) {
      return NextResponse.json(
        { error: "Invalid campaign address" },
        { status: 400 }
      );
    }

    // check if productId is a number or a string which contains a number (string must be a number)
    if (typeof productId !== "number") {
      if (isNaN(Number(productId))) {
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }
    }

    // check if quantity is a number or a string which contains a number (string must be a number)
    if (typeof quantity !== "number") {
      if (isNaN(Number(quantity))) {
        return NextResponse.json(
          { error: "Invalid quantity" },
          { status: 400 }
        );
      }
    }

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL
    );

    // Get the contract instance
    const contract = new ethers.Contract(
      campaignAddress,
      USDCFundraiserUpgradable.abi,
      provider
    );

    // Convert values using different methods to see which works
    let convertedProductId = ethers.parseUnits(productId.toString(), 0);
    const convertedQuantity = ethers.parseUnits(quantity.toString(), 0);

    // Check if the campaign is finalized
    try {
      const isFinalized = await contract.finalized();
      console.log("Campaign finalized status:", isFinalized);

      if (isFinalized) {
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
      console.log("Product ID:", convertedProductId);

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

          if (
            BigInt(productSoldCount) + BigInt(convertedQuantity) >
            BigInt(supplyLimit)
          ) {
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

    // console.log("Converted values:", {
    //   productId: {
    //     original: productId,
    //     converted: convertedProductId.toString(),
    //   },
    //   quantity: {
    //     original: quantity,
    //     converted: convertedQuantity.toString(),
    //   },
    // });

    const originalProductId = await contract.getOriginalProductId(
      convertedProductId
    );
    console.log("Original Product ID:", originalProductId);
    convertedProductId = originalProductId;
    // Try encoding with the converted values
    const txData = contract.interface.encodeFunctionData("deposit", [
      convertedProductId,
      convertedQuantity,
    ]);

    // console.log("Generated transaction data:", txData);

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
