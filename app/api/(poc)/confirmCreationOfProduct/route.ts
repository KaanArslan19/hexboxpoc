import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { ethers } from "ethers";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactionHash, status, productId, campaignId } = body;

    if (!transactionHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction hash is required",
        },
        { status: 400 }
      );
    }

    // If transaction failed
    if (status === "failed") {
      // Delete the product from the database
      try {
        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        await db.collection("products").deleteOne({
          productId: productId,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: "Transaction failed on-chain, product deleted from database",
          },
          { status: 400 }
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Transaction failed and product deletion failed",
          },
          { status: 500 }
        );
      }
    }

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Wait for transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt || !receipt.status) {
      // Delete the product from the database
      try {
        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        await db.collection("products").deleteOne({
          productId: productId,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: "Transaction failed or not found, product deleted from database",
          },
          { status: 400 }
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Transaction failed and product deletion failed",
          },
          { status: 500 }
        );
      }
    }

    // Verify the product was added to the contract
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const product = await db.collection("products").findOne({
      productId: productId,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found in database",
        },
        { status: 404 }
      );
    }

    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 }
      );
    }

    // Get the fundraiser contract
    const fundraiserContract = new ethers.Contract(
      campaign.fundraiser_address,
      USDCFundraiser.abi,
      provider
    );

    // Check if the product exists in the contract
    try {
      const productConfig = await fundraiserContract.products(product.productId);
      
      if (productConfig.price.toString() === "0") {
        // Product not found in contract, delete from database
        await db.collection("products").deleteOne({
          productId: productId,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: "Product not found in contract, deleted from database",
          },
          { status: 400 }
        );
      }
      
      // Update product status in database
      await db.collection("products").updateOne(
        { productId: productId },
        { $set: { status: "active" } }
      );
      
      return NextResponse.json({
        success: true,
        productId,
        transactionHash,
      });
    } catch (error) {
      console.error("Error verifying product in contract:", error);
      
      // Delete the product from the database
      await db.collection("products").deleteOne({
        productId: productId,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: "Error verifying product in contract, deleted from database",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing product creation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process product creation",
      },
      { status: 500 }
    );
  }
};
