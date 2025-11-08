import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import USDCFundraiserFactoryUpgradable from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserFactoryUpgradeable.sol/USDCFundraiserFactoryUpgradeable.json";
//import USDCFundraiserUpgradable from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserUpgradable.sol/USDCFundraiserUpgradable.json";
//import ProductTokenUpgradable from "@/app/utils/contracts/artifacts/contracts/ProductTokenUpgradable.sol/ProductTokenUpgradable.json";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { deleteCampaign } from "@/app/utils/poc_utils/deleteCampaign";
import { syncProductIdsWithChain } from "@/app/utils/poc_utils/syncProductIdsWithChain";

import type { ProductToken } from "@/app/utils/typechain-types";

interface IERC20 {
  transfer(to: string, amount: bigint): Promise<any>;
  balanceOf(account: string): Promise<bigint>;
}

export const POST = async (req: NextRequest) => {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      console.log(session.address);
    }

    const body = await req.json();
    const { transactionHash, campaignId } = body;

    if (!transactionHash || !campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction hash and campaign ID are required",
        },
        { status: 400 }
      );
    }

    // Check if transactionHash is in valid EVM transaction hash format
    // EVM transaction hash should be a 0x-prefixed 32-byte hex string (66 chars including 0x)
    const validHashFormat = /^0x[0-9a-fA-F]{64}$/;
    if (!validHashFormat.test(transactionHash)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction hash format. Must be a 0x-prefixed 32-byte hex string.",
        },
        { status: 400 }
      );
    }

    console.log("campaignId", campaignId);
    let campaignIdObjectId;
    try {
      campaignIdObjectId = new ObjectId(campaignId as string);
      console.log("campaignIdObjectId", campaignIdObjectId);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid campaign ID format",
        },
        { status: 400 }
      );
    }

    const userWalletAddress = session.address;
    console.log("userWalletAddress", userWalletAddress);

    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const result = await db.collection("campaigns").findOne({
      _id: campaignIdObjectId,
      user_id: userWalletAddress,
      status: "draft",
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found or already configured",
        },
        { status: 404 }
      );
    }

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL
    );

    // Wait for transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt || !receipt.status) {
      const result = await deleteCampaign(campaignId);
      return NextResponse.json(
        {
          success: false,
          error: "Transaction failed or not found",
        },
        { status: 400 }
      );
    }

    // Get factory contract
    const factoryContract = new ethers.Contract(
      CONTRACTS.USDCFundraiserFactory.fuji,
      USDCFundraiserFactoryUpgradable.abi,
      provider
    );

    // Find FundraiserCreated event
    const events = receipt.logs
      .filter(
        (log) =>
          log.address.toLowerCase() ===
          CONTRACTS.USDCFundraiserFactory.fuji.toLowerCase()
      )
      .map((log) => {
        try {
          return factoryContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
        } catch (e) {
          return null;
        }
      })
      .filter((event) => event && event.name === "FundraiserCreated");

    if (!events.length) {
      const result = await deleteCampaign(campaignId);
      return NextResponse.json(
        {
          success: false,
          error: "Fundraiser creation event not found",
        },
        { status: 400 }
      );
    }

    const fundraiserAddress = events?.[0]?.args?.fundraiser;
    if (!fundraiserAddress) {
      const result = await deleteCampaign(campaignId);
      return NextResponse.json(
        {
          success: false,
          error: "Fundraiser address not found in transaction receipt",
        },
        { status: 400 }
      );
    }

    // const deployer = new ethers.Wallet(
    //   process.env.DEPLOYER_PRIVATE_KEY!,
    //   provider
    // );

    // const productToken = new ethers.Contract(
    //   CONTRACTS.ProductToken.fuji,
    //   ProductTokenABI.abi,
    //   provider
    // ).connect(deployer) as unknown as ProductToken;

    // const grantRole = await productToken.grantRole(
    //   await productToken.MINTER_ROLE(),
    //   fundraiserAddress
    // );
    // console.log("Grant role:", grantRole);
    // await grantRole.wait();

    await db.collection("campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      {
        $set: {
          configured: true,
          fundraiser_address: fundraiserAddress.toLowerCase(),
          status: "active",
        },
      }
    );
    console.log("Campaign updated:", result);

    // Sync product IDs with on-chain unique product IDs
    console.log("Starting product ID synchronization...");
    const syncResult = await syncProductIdsWithChain(
      campaignId,
      fundraiserAddress.toLowerCase()
    );
    
    if (!syncResult.success) {
      console.error("Product ID sync completed with errors:", syncResult.errors);
      // Log errors but don't fail the entire request
      // The campaign is still created successfully
    } else {
      console.log("Product ID sync completed successfully:", syncResult.syncedProducts);
    }

    // const fundraiser = new ethers.Contract(
    //   fundraiserAddress,
    //   USDCFundraiserABI.abi,
    //   provider
    // ).connect(deployer) as unknown as {
    //   initializeChainlink(
    //     params: string,
    //     overrides?: { gasLimit: number }
    //   ): Promise<any>;
    //   getStationUpkeepID(): Promise<bigint>;
    //   getAddress(): Promise<string>;
    //   interface: ethers.Interface;
    // };

    // const linkToken = new ethers.Contract(
    //   CONTRACTS.LINK.fuji,
    //   [
    //     "function balanceOf(address account) view returns (uint256)",
    //     "function transfer(address to, uint256 amount) returns (bool)",
    //   ],
    //   provider
    // ).connect(deployer) as unknown as IERC20;

    // try {
    //   // Check LINK balance
    //   const fundraiserContractAddress = await fundraiser.getAddress();
    //   const linkBalance = await linkToken.balanceOf(deployer.address);
    //   const fundraiserLinkBalance = await linkToken.balanceOf(
    //     fundraiserContractAddress
    //   );
    //   console.log("Deployer LINK balance:", ethers.formatEther(linkBalance));

    //   if (linkBalance < ethers.parseEther("1")) {
    //     throw new Error(
    //       "Insufficient LINK tokens. Get some from https://faucets.chain.link/fuji"
    //     );
    //   }

    //   // Transfer LINK to contract
    //   if (fundraiserLinkBalance < ethers.parseEther("1")) {
    //     console.log("Transferring LINK to contract...");
    //     const transferTx = await linkToken.transfer(
    //       fundraiserContractAddress,
    //       ethers.parseEther("1")
    //     );
    //     await transferTx.wait();
    //     console.log("LINK transferred to contract");

    //     // Verify LINK transfer
    //     const contractLinkBalance = await linkToken.balanceOf(
    //       fundraiserContractAddress
    //     );
    //     console.log(
    //       "Contract LINK balance:",
    //       ethers.formatEther(contractLinkBalance)
    //     );
    //   }

    //   // Register with Chainlink
    //   console.log("Registering with Chainlink...");
    //   const fundraiserAddress = await fundraiser.getAddress();
    //   console.log("Fundraiser address:", fundraiserAddress);
    //   console.log("Deployer address:", deployer.address);
    //   try {
    //     const registrationParams = ethers.AbiCoder.defaultAbiCoder().encode(
    //       [
    //         "tuple(string,bytes,address,uint32,address,uint8,bytes,bytes,bytes,uint96)",
    //       ],
    //       [
    //         [
    //           result.title,
    //           "0x",
    //           fundraiserAddress,
    //           300000,
    //           deployer.address,
    //           0,
    //           "0x",
    //           "0x",
    //           "0x",
    //           BigInt(1000000000000000000), // 1 LINK
    //         ],
    //       ]
    //     );
        // const estimatedGas = await fundraiser.initializeChainlink.estimateGas(
        //     registrationParams
        // );
        // const gasLimit = (estimatedGas * BigInt(105)) / BigInt(100);
        // console.log("Estimated gas:", estimatedGas);
        // console.log("Gas limit:", gasLimit);
        // const tx = await fundraiser.initializeChainlink(registrationParams, {
        //   gasLimit: 1000000, //gasLimit
        // });
        // console.log("Registration tx sent:", tx.hash);

        // const receipt = await tx.wait(2);
        // console.log("Transaction status:", receipt?.status);
        // const upkeepID = await fundraiser.getStationUpkeepID();
        // console.log("Upkeep ID:", upkeepID);

        // Update MongoDB
      // await db.collection("campaigns").updateOne(
      //   { _id: new ObjectId(campaignId) },
      //   {
      //     $set: {
      //       configured: true,
      //       //upkeep_id: upkeepID.toString(),
      //       fundraiser_address: fundraiserAddress.toLowerCase(),
      //     },
      //   }
      // );
      // console.log("Campaign updated:", result);
        // Check for events
        // if (receipt?.logs) {
        //   for (const log of receipt.logs) {
        //     try {
        //       const decodedLog = fundraiser.interface.parseLog(log);
        //       if (decodedLog) {
        //         console.log("Event:", decodedLog.name, decodedLog.args);
        //       }
        //     } catch (e) {
        //       // Skip logs that can't be decoded
        //     }
        //   }
        // }
      // } catch (error: any) {
      //   console.error("Registration failed:", error.message);
      //   throw error;
      // }
    // } catch (error) {
    //   console.error("Error during deployment:", error);
    //   throw error;
    // }

    return NextResponse.json({
      success: true,
      fundraiserAddress,
      transactionHash,
      productSync: {
        synced: syncResult.syncedProducts.length,
        errors: syncResult.errors.length > 0 ? syncResult.errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error processing fundraiser creation:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process fundraiser creation",
      },
      { status: 500 }
    );
  }
};
