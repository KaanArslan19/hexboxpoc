import client from "@/app/utils/mongodb";
import { ethers } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { ObjectId } from "mongodb";

/**
 * Format a blockchain amount (in smallest unit) to a human-readable format
 * Converts from the smallest unit (e.g., 1000000 for USDC) to a decimal value (e.g., 1.0)
 * Removes trailing zeros and decimal point if it's a whole number
 * @param amount The amount in smallest unit (e.g., 1000000 for 1 USDC)
 * @param decimals The number of decimal places (default: 6 for USDC)
 * @returns Formatted string representation
 */
function formatAmount(amount: string | number, decimals: number = 6): string {
  // Convert to a decimal number by dividing by 10^decimals
  const value = Number(amount) / Math.pow(10, decimals);
  
  // Convert to string and remove trailing zeros
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: false
  });
}

export async function syncExternalData(fundraiserAddress?: string) {
  try {
    const db = client.db("hexbox_poc");
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);

    // If no specific fundraiser address, get all fundraiser addresses from campaigns
    const fundraiserAddresses = fundraiserAddress 
      ? [fundraiserAddress]
      : await db.collection("campaigns")
          .find({ fundraiser_address: { $exists: true } })
          .map(campaign => campaign.fundraiser_address)
          .toArray();

    console.log("Syncing fundraisers:", fundraiserAddresses);

    // Process each fundraiser
    const results = await Promise.all(fundraiserAddresses.map(async (address) => {
      try {
        // Get contract instance
        const contract = new ethers.Contract(
          address,
          USDCFundraiser.abi,
          provider
        );

        // Fetch on-chain data
        let [isFinalized, deadline, minimumTarget, totalRaised, productIds] = await Promise.all([
          contract.finalized(),
          contract.deadline(),
          contract.minimumTarget(),
          contract.totalRaised(),
          contract.getProductIds(),
        ]);

        if (isFinalized == true) {
            isFinalized = "finalized";
        } else {
            isFinalized = "active";
        }

        // Format the amounts for human readability
        const formattedTotalRaised = formatAmount(totalRaised);
        const formattedMinimumTarget = formatAmount(minimumTarget);

        console.log(`Total raised: ${totalRaised} -> ${formattedTotalRaised}`);
        console.log(`Minimum target: ${minimumTarget} -> ${formattedMinimumTarget}`);

        // Get campaign from database
        const campaign = await db.collection("campaigns").findOne({ fundraiser_address: address });
        if (!campaign) {
          throw new Error(`Campaign not found for fundraiser address: ${address}`);
        }

        // Update campaign in database
        await db.collection("campaigns").updateOne(
          { fundraiser_address: address },
          {
            $set: {
              status: isFinalized,
              deadline: deadline.toString(),
              fund_amount: formattedMinimumTarget,
              total_raised: formattedTotalRaised,
              last_synced: Date.now()
            }
          }
        );

        // Sync product stock levels
        const productUpdates = await syncProductStockLevels(db, contract, productIds, campaign._id);

        return {
          address,
          success: true,
          message: "Sync completed",
          productUpdates
        };
      } catch (error) {
        console.error(`Error syncing fundraiser ${address}:`, error);
        return {
          address,
          success: false,
          error: String(error)
        };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Sync completed. Success: ${successCount}, Failed: ${failureCount}`,
      details: results
    };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, error: String(error) };
  }
}

async function syncProductStockLevels(db: any, contract: any, productIds: any, campaignId: any) {
  try {
    const productUpdates = [];
    console.log(`Syncing product stock levels for campaign: ${campaignId}`);
    console.log(`Product IDs: ${productIds}`);
    // Get all products for this campaign
    const products = await db.collection("products").find({
      campaignId: campaignId.toString(),
    }).toArray();

    // Create a map of productId to product for quick lookup
    const productMap: { [key: string]: any } = {};
    products.forEach((product: any) => {
      console.log(`Product: ${JSON.stringify(product)}`);
      if (product.productId) {
        productMap[product.productId] = product;
      }
    });

    // Process each product ID from the blockchain
    for (const productId of productIds) {
      try {
        // Get product sold count from blockchain
        const soldCount = await contract.productSoldCount(productId);
        
        // Get product config to check supply limit
        const productConfig = await contract.products(productId);
        const supplyLimit = productConfig.supplyLimit;
        
        // Find the corresponding product in our database
        const product = productMap[productId.toString()];
        console.log(`Product map: ${JSON.stringify(productMap)}`);
        
        if (product) {
          // Calculate remaining stock
          let remainingStock = 0;
          
          if (supplyLimit.toString() === "0") {
            // If supplyLimit is 0, it means unlimited supply
            remainingStock = -1; // Use -1 to represent unlimited
          } else {
            remainingStock = Number(supplyLimit) - Number(soldCount);
            if (remainingStock < 0) remainingStock = 0;
          }

          console.log(`Remaining stock for product ${productId}: ${remainingStock}`);
          const inventoryUpdateString = JSON.stringify({
            stock_level: remainingStock
          });

          // Update the product in the database
          await db.collection("products").updateOne(
            { _id: new ObjectId(product._id) },
            {
              $set: {
                inventory: inventoryUpdateString,
                last_synced: Date.now(),
                sold_count: soldCount.toString()
              }
            }
          );
          
          productUpdates.push({
            lastSync: Date.now(),
            productId: product._id,
            productTokenId: productId.toString(),
            soldCount: Number(soldCount),
            remainingStock,
            supplyLimit: supplyLimit.toString()
          });

          console.log(`Product updates: ${JSON.stringify(productUpdates)}`);
        } else {
          console.log(`Product not found for productId: ${productId}`);
        }
      } catch (error) {
        console.error(`Error syncing product ${productId}:`, error);
        productUpdates.push({
          productTokenId: productId.toString(),
          error: String(error)
        });
      }
    }
    
    return productUpdates;
  } catch (error) {
    console.error("Error syncing product stock levels:", error);
    return { error: String(error) };
  }
} 