import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ethers } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import USDCFundraiserFactory from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserFactory.sol/USDCFundraiserFactory.json";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import ProductTokenABI from "@/app/utils/contracts/artifacts/contracts/ProductToken.sol/ProductToken.json";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";

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
    const { transactionHash, status } = body;

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
      return NextResponse.json(
        {
          success: false,
          error: "Transaction failed on-chain",
        },
        { status: 400 }
      );
    }

    const campaignId = body.campaignId;
    console.log("campaignId", campaignId);
    const userWalletAddress = session.address;
    console.log("userWalletAddress", userWalletAddress);

    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const result = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      user_id: userWalletAddress,
      configured: false,
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
      USDCFundraiserFactory.abi,
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
      return NextResponse.json(
        {
          success: false,
          error: "Fundraiser address not found",
        },
        { status: 400 }
      );
    }

    // TODO: Launch Chainlink Upkeep for the fundraiser
    // This would be your implementation to register the upkeep with Chainlink
    const deployer = new ethers.Wallet(
      process.env.DEPLOYER_PRIVATE_KEY!,
      provider
    );

    const fundraiser = new ethers.Contract(
      fundraiserAddress,
      USDCFundraiserABI.abi,
      provider
    ).connect(deployer) as unknown as {
      initializeChainlink(
        params: string,
        overrides?: { gasLimit: number }
      ): Promise<any>;
      getStationUpkeepID(): Promise<bigint>;
      getAddress(): Promise<string>;
      interface: ethers.Interface;
    };

    const productToken = new ethers.Contract(
      CONTRACTS.ProductToken.fuji,
      ProductTokenABI.abi,
      provider
    ).connect(deployer) as unknown as ProductToken;

    const grantRole = await productToken.grantRole(
      await productToken.MINTER_ROLE(),
      fundraiserAddress
    );
    console.log("Grant role:", grantRole);
    await grantRole.wait();

    const linkToken = new ethers.Contract(
      CONTRACTS.LINK.fuji,
      [
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
      ],
      provider
    ).connect(deployer) as unknown as IERC20;

    try {
      // Check LINK balance
      const fundraiserContractAddress = await fundraiser.getAddress();
      const linkBalance = await linkToken.balanceOf(deployer.address);
      const fundraiserLinkBalance = await linkToken.balanceOf(
        fundraiserContractAddress
      );
      console.log("Deployer LINK balance:", ethers.formatEther(linkBalance));

      if (linkBalance < ethers.parseEther("1")) {
        throw new Error(
          "Insufficient LINK tokens. Get some from https://faucets.chain.link/fuji"
        );
      }

      // Transfer LINK to contract
      if (fundraiserLinkBalance < ethers.parseEther("1")) {
        console.log("Transferring LINK to contract...");
        const transferTx = await linkToken.transfer(
          fundraiserContractAddress,
          ethers.parseEther("1")
        );
        await transferTx.wait();
        console.log("LINK transferred to contract");

        // Verify LINK transfer
        const contractLinkBalance = await linkToken.balanceOf(
          fundraiserContractAddress
        );
        console.log(
          "Contract LINK balance:",
          ethers.formatEther(contractLinkBalance)
        );
      }

      // Register with Chainlink
      console.log("Registering with Chainlink...");
      const fundraiserAddress = await fundraiser.getAddress();
      console.log("Fundraiser address:", fundraiserAddress);
      console.log("Deployer address:", deployer.address);
      try {
        const registrationParams = ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "tuple(string,bytes,address,uint32,address,uint8,bytes,bytes,bytes,uint96)",
          ],
          [
            [
              result.title,
              "0x",
              fundraiserAddress,
              300000,
              deployer.address,
              0,
              "0x",
              "0x",
              "0x",
              BigInt(1000000000000000000), // 1 LINK
            ],
          ]
        );
        // const estimatedGas = await fundraiser.initializeChainlink.estimateGas(
        //     registrationParams
        // );
        // const gasLimit = (estimatedGas * BigInt(105)) / BigInt(100);
        // console.log("Estimated gas:", estimatedGas);
        // console.log("Gas limit:", gasLimit);
        const tx = await fundraiser.initializeChainlink(registrationParams, {
          gasLimit: 1000000, //gasLimit
        });
        console.log("Registration tx sent:", tx.hash);

        const receipt = await tx.wait(2);
        console.log("Transaction status:", receipt?.status);
        const upkeepID = await fundraiser.getStationUpkeepID();
        console.log("Upkeep ID:", upkeepID);

        // Update MongoDB
        await db.collection("campaigns").updateOne(
          { _id: new ObjectId(campaignId) },
          {
            $set: {
              configured: true,
              upkeep_id: upkeepID.toString(),
              fundraiser_address: fundraiserAddress,
            },
          }
        );
        console.log("Campaign updated:", result);
        // Check for events
        if (receipt?.logs) {
          for (const log of receipt.logs) {
            try {
              const decodedLog = fundraiser.interface.parseLog(log);
              if (decodedLog) {
                console.log("Event:", decodedLog.name, decodedLog.args);
              }
            } catch (e) {
              // Skip logs that can't be decoded
            }
          }
        }
      } catch (error: any) {
        console.error("Registration failed:", error.message);
        throw error;
      }
    } catch (error) {
      console.error("Error during deployment:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      fundraiserAddress,
      transactionHash,
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
