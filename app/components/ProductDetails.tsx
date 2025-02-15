"use client";
import Image from "next/image";
import { Product } from "@/app/types";
import Link from "next/link";
import CustomButton from "./ui/CustomButton";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi"; // Import useAccount and useWalletClient for wallet connection check
import { ethers } from "ethers";
import { CONTRACTS, ABIS } from "@/app/utils/contracts/contracts";

interface CampaignProductsProps {
  product: Product;
}

const ProductDetails = ({ product }: CampaignProductsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  //const [campaignAddress, setCampaignAddress] = useState<string | null>(null);

  const getCampaignAddress = async () => {
    const response = await fetch(`/api/getCampaignFromProduct?productId=${product.id}`);
    const data = await response.json();
    console.log(data);

    //setCampaignAddress(data.campaign.fundraiser_address);
    console.log(data.campaign.fundraiser_address);

    return data.campaign.fundraiser_address;
  }

  const checkAllowance = async (_campaignAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);
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
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);


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

      setIsLoading(true)
      
      // Call the API to prepare the transaction
      const response = await fetch("/api/buyProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignAddress: _campaignAddress,
          userAddress: address,
          productId: product.productId,
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

      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);
      const receipt = await provider.waitForTransaction(hash);

      if (receipt?.status === 1) {
        alert("Successfully backed the project!");
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

  console.log(product);
  return (
    <main className="p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative w-full h-96">
              <Image
                src={`${process.env.R2_BUCKET_URL}/product_logos/${product.image}`}
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
                  pledged of fundAmount of campaign goal
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Backers</p>
                <p className="text-3xl font-bold">2,714</p>
              </div>
              <div>
                <p className="text-lightBlueColor/80 text-sm">Days to Go</p>
                <p className="text-3xl font-bold">36</p>
              </div>
              <Link href="" className="w-full md:w-auto">
                <CustomButton 
                  onClick={handleBackProject}
                  disabled={isLoading || isApproving}
                  className={`py-2 md:py-4 hover:bg-blueColor/80 bg-blueColor text-white w-full md:w-auto mt-2 ${
                    (isLoading || isApproving) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isApproving ? 'Approving USDC...' : 
                   isLoading ? 'Processing...' : 'Back this Project'}
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Project We Love</h2>
          <p className="text-gray-700">
            This project will only be funded if it reaches its goal by campaign
            end date
          </p>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
