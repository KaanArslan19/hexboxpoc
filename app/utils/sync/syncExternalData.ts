import client from "@/app/utils/mongodb";
import { ethers } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import USDCFundraiser from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";

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
        let [isFinalized, deadline, minimumTarget, totalRaised] = await Promise.all([
          contract.finalized(),
          contract.deadline(),
          contract.minimumTarget(),
          contract.totalRaised()
        ]);

        if (isFinalized == true) {
            isFinalized = "finalized";
        } else {
            isFinalized = "active";
        }

        // Update campaign in database
        await db.collection("campaigns").updateOne(
          { fundraiser_address: address },
          {
            $set: {
              status: isFinalized,
              deadline: deadline.toString(),
              minimum_target: minimumTarget.toString(),
              total_raised: totalRaised.toString(),
              last_synced: new Date()
            }
          }
        );

        return {
          address,
          success: true,
          message: "Sync completed"
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