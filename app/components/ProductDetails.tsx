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
import { Tabs } from "antd";
import { Input } from "@material-tailwind/react";
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
  const [activeTab, setActiveTab] = useState("1");

  // Handle tab change
  const [isApproving, setIsApproving] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [productQuantity, setProductQuantity] = useState<number>(0);

  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  //const [campaignAddress, setCampaignAddress] = useState<string | null>(null);

  const items = [
    {
      key: "1",
      label: "Overview",
      children: (
        <div className="p-4">
          <p className="text-gray-700 mb-4">{campaign.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-3 rounded-md">
              <span className="font-semibold text-gray-800">Funding Type</span>
              <p className="mt-1">{campaign.funding_type}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-md">
              <span className="font-semibold text-gray-800">Status</span>
              <p className="mt-1 flex items-center">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    campaign.status === "Active"
                      ? "bg-green-500"
                      : campaign.status === "Ended"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                ></span>
                {campaign.status}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: "Gallery",
      children: (
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product &&
            product.images &&
            product.images.uploadedFiles &&
            product.images.uploadedFiles.length > 0 ? (
              product.images.uploadedFiles.map((image, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg shadow-md aspect-w-16 aspect-h-9"
                >
                  <Image
                    src={`${process.env.R2_BUCKET_URL}/product_images/${image}`}
                    alt={`Product image ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full transition duration-300 hover:scale-105"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 p-6 bg-gray-100 rounded-lg text-center text-gray-500">
                No images available for this product
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "3",
      label: "Tech Details",
      children: (
        <div className="p-4">
          <div className="mb-4">
            <span className="font-semibold text-gray-800">Wallet Address</span>
            <div className="mt-1 p-3 bg-gray-100 rounded-md overflow-x-auto">
              <code className="text-sm">{campaign.wallet_address}</code>
              <button className="ml-2 text-blue-600 hover:text-blue-800">
                <span className="text-xs">Copy</span>
              </button>
            </div>
          </div>
        </div>
      ),
    },

    {
      key: "4",
      label: "Verification",
      children: (
        <div className="p-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                campaign.is_verified ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {campaign.is_verified ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>
            <span className="text-lg font-medium">
              {campaign.is_verified ? "Verified Campaign" : "Not Verified"}
            </span>
            <p className="text-gray-600 text-center mt-2">
              {campaign.is_verified
                ? "This campaign has been verified by our team and meets all our standards."
                : "This campaign has not yet been verified by our team. Proceed with caution."}
            </p>
            {campaign.location && (
              <div className="mt-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{campaign.location}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];
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

      const allowance = await usdcContract.allowance(
        address!,
        _campaignAddress
      );

      // Convert product.price to same decimals as USDC for comparison
      const requiredAmount = ethers.parseUnits(
        product.price.amount.toString(),
        6
      ); // USDC has 6 decimals
      console.log("allowance", allowance);
      console.log("requiredAmount", requiredAmount);
      console.log("allowance >= requiredAmount", allowance >= requiredAmount);
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
      //const hasAllowance = await checkAllowance(_campaignAddress);
      //console.log("hasAllowance", hasAllowance);
      //if (!hasAllowance) {
      const approved = await handleApprove(_campaignAddress);
      if (!approved) return;
      //}

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
          productId: product.productId,
          quantity: productQuantity,
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
        // Sync campaign data after successful transaction
        // try {
        //   const syncResponse = await fetch("/api/sync", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //       fundraiserAddress: _campaignAddress,
        //     }),
        //   });
        //   console.log("Sync response:", syncResponse);

        //   if (!syncResponse.ok) {
        //     console.error("Failed to sync campaign data after purchase");
        //   } else {
        //     const syncResult = await syncResponse.json();
        //     console.log("Sync after purchase result:", syncResult);
        //   }
        // } catch (syncError) {
        //   console.error("Error syncing campaign after purchase:", syncError);
        // }
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
        product.productId
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
        BigInt(product.productId),
        BigInt(productQuantity),
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    if (!isNaN(value)) {
      setProductQuantity(value);
    } else {
      setProductQuantity(0);
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
  }, [address, isConnected, product.productId]); // Dependencies array includes address and product ID

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
              <div>
                <Input
                  placeholder="Enter the desired amount for the product"
                  className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 placeholder:opacity-100 "
                  labelProps={{
                    className: "hidden",
                  }}
                  step="1"
                  type="number"
                  min="0"
                  value={productQuantity === 0 ? "" : productQuantity}
                  onChange={handleInputChange}
                />
              </div>
              <div>
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
        </div>
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">About this Product</h2>
          </div>
          <Tabs
            tabPosition="left"
            items={items}
            defaultActiveKey="1"
            className="campaign-details-tabs my-4 custom-tab"
          />
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
