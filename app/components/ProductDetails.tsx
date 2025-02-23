"use client";

import Image from "next/image";
import { ProductFetch } from "@/app/types";
import Link from "next/link";
import CustomButton from "./ui/CustomButton";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi"; // Import useAccount and useWalletClient for wallet connection check
import { ethers } from "ethers";
import { CONTRACTS, ABIS } from "@/app/utils/contracts/contracts";
import type { ProductToken } from "@/app/utils/typechain-types";
import ProductTokenABI from "@/app/utils/contracts/artifacts/contracts/ProductToken.sol/ProductToken.json";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";

interface CampaignProductsProps {
  product: ProductFetch;
}

interface Campaign {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  wallet_address: string;
  token_address: string;
  logo: string;
  timestamp: number;
  status: string;
  fund_amount: string;
  one_liner: string;
  social_links: any;
  location: string | null;
  deadline: number;
  is_verified: boolean;
  funding_type: string;
  product_or_service: string;
  evm_wa: string;
  created_timestamp?: number;
}

interface CampaignProductsProps {
  product: ProductFetch;
  campaign: Campaign;
}

const ProductDetails = ({ product, campaign }: CampaignProductsProps) => {
  const daysToGo = Math.max(
    Math.ceil((campaign.deadline - Date.now()) / (1000 * 60 * 60 * 24)),
    0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  //const [campaignAddress, setCampaignAddress] = useState<string | null>(null);

  const getCampaignAddress = async () => {
    const response = await fetch(
      `/api/getCampaignFromProduct?productId=${product.id}`
    );
    const data = await response.json();
    console.log(data);

    //setCampaignAddress(data.campaign.fundraiser_address);
    console.log(data.campaign.fundraiser_address);

    return data.campaign.fundraiser_address;
  };

  const checkAllowance = async (_campaignAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC.fuji,
        ABIS.USDC_ABI,
        provider
      );

      const allowance = await usdcContract.approve(
        _campaignAddress,
        ethers.MaxUint256
      );

      // Convert product.price to same decimals as USDC for comparison
      const requiredAmount = ethers.parseUnits(product.price.toString(), 6); // USDC has 6 decimals
      return allowance >= requiredAmount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  const handleApprove = async (_campaignAddress: string) => {
    if (!isConnected || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsApproving(true);
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );

      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC.fuji,
        ABIS.USDC_ABI,
        provider
      );

      // Approve maximum amount (or you can approve exact amount needed)
      const maxAmount = ethers.MaxUint256;
      const txData = usdcContract.interface.encodeFunctionData("approve", [
        _campaignAddress,
        maxAmount,
      ]);

      const hash = await walletClient.sendTransaction({
        to: CONTRACTS.USDC.fuji as `0x${string}`,
        data: txData as `0x${string}`,
      });

      const receipt = await provider.waitForTransaction(hash as `0x${string}`);

      if (receipt?.status === 1) {
        alert("Successfully approved USDC spending!");
        return true;
      } else {
        throw new Error("Approval transaction failed");
      }
    } catch (error) {
      console.error("Error approving USDC:", error);
      alert("Failed to approve USDC spending. Please try again.");
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const handleBackProject = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const _campaignAddress = await getCampaignAddress();
      console.log("Campaign address:", _campaignAddress);

      // Check USDC allowance first
      const hasAllowance = await checkAllowance(_campaignAddress);
      if (!hasAllowance) {
        const approved = await handleApprove(_campaignAddress);
        if (!approved) return;
      }

      setIsLoading(true);

      // Call the API to prepare the transaction
      const response = await fetch("/api/buyProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignAddress: _campaignAddress,
          userAddress: address,
          productId: product.id,
          quantity: 1, // TODO: Change to amount of product user wants to buy
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to prepare transaction: ${errorData.error}`);
      }

      const data = await response.json();
      console.log("Transaction data:", data);

      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      const hash = await walletClient.sendTransaction({
        to: data.to as `0x${string}`,
        data: data.data as `0x${string}`,
      });

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const receipt = await provider.waitForTransaction(hash);

      if (receipt?.status === 1) {
        alert("Successfully backed the project!");
        // Refresh token balance after successful purchase
        await checkTokenBalance(_campaignAddress);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error backing project:", error);
      alert("Failed to back project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to check token balance
  const checkTokenBalance = async (campaignAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const productTokenContract = new ethers.Contract(
        CONTRACTS.ProductToken.fuji,
        ProductTokenABI.abi,
        provider
      ) as unknown as ProductToken;

      const balance = await productTokenContract.balanceOf(
        address!,
        product.id
      );
      setTokenBalance(balance);
      return balance > 0;
    } catch (error) {
      console.error("Error checking token balance:", error);
      return false;
    }
  };

  const handleRefund = async () => {
    if (!isConnected || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsRefunding(true);
      const campaignAddress = await getCampaignAddress();

      // Check if user has tokens to refund
      const hasTokens = await checkTokenBalance(campaignAddress);
      if (!hasTokens) {
        throw new Error("No tokens available to refund");
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const contract = new ethers.Contract(
        campaignAddress,
        USDCFundraiserABI.abi,
        provider
      );

      // Encode the refund function call
      const txData = contract.interface.encodeFunctionData("claimRefund", [
        BigInt(product.id),
        BigInt(1), // Refund 1 token for now, could be made variable
      ]);

      const hash = await walletClient.sendTransaction({
        to: campaignAddress as `0x${string}`,
        data: txData as `0x${string}`,
      });

      const receipt = await provider.waitForTransaction(hash);

      if (receipt?.status === 1) {
        alert("Successfully refunded!");
        // Refresh token balance after successful refund
        await checkTokenBalance(campaignAddress);
      } else {
        throw new Error("Refund transaction failed");
      }
    } catch (error) {
      console.error("Error refunding:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to refund. Please try again."
      );
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    const updateTokenBalance = async () => {
      if (isConnected && address) {
        const campaignAddress = await getCampaignAddress();
        await checkTokenBalance(campaignAddress);
      }
    };

    updateTokenBalance();
  }, [address, isConnected, product.id]); // Dependencies array includes address and product ID
  console.log("---product", product);
  return (
    <main className="p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative w-full h-96">
              <Image
                src={`${process.env.R2_BUCKET_URL}/product_logos/${product.logo}`}
                alt={product.name}
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold mt-6 mb-4">{product.name}</h1>
            <p className="text-lg text-gray-700">{product.description}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm">Funds Pledged</p>
                <p className="text-3xl font-bold">AU$676,830</p>
                <p className="text-sm text-gray-600">
                  Pledged of {campaign.fund_amount} campaign goal
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Backers</p>
                <p className="text-3xl font-bold">2,714</p>
              </div>
              <div>
                <p className="text-lightBlueColor/80 text-sm">Days to Go</p>
                <p className="text-3xl font-bold">{daysToGo}</p>
              </div>
              <Link href="" className="w-full md:w-auto">
                <CustomButton
                  onClick={handleBackProject}
                  disabled={isLoading || isApproving}
                  className={`py-2 md:py-4 hover:bg-blueColor/80 bg-blueColor text-white w-full md:w-auto mt-2 ${
                    isLoading || isApproving
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isApproving
                    ? "Approving USDC..."
                    : isLoading
                    ? "Processing..."
                    : "Back this Project"}
                </CustomButton>
              </Link>
              {tokenBalance > 0 && (
                <CustomButton
                  onClick={handleRefund}
                  disabled={isRefunding}
                  className={`py-2 md:py-4 hover:bg-redColor/80 bg-redColor text-white w-full md:w-auto mt-2 ${
                    isRefunding ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isRefunding ? "Processing Refund..." : "Request Refund"}
                </CustomButton>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">About this Campaign</h2>
          <p className="text-gray-700">{campaign.description}</p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Funding Type:</span>{" "}
            {campaign.funding_type}
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Status:</span> {campaign.status}
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Wallet Address:</span>{" "}
            {campaign.wallet_address}
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Token Address:</span>{" "}
            {campaign.token_address}
          </p>
          {campaign.location && (
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Location:</span>{" "}
              {campaign.location}
            </p>
          )}
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Verification:</span>{" "}
            {campaign.is_verified ? "Verified" : "Not Verified"}
          </p>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
