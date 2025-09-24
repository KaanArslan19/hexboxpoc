"use client";

import Image from "next/image";
import { CampaignDetailsProps, ProductFetch } from "@/app/types";
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
import { productOrServiceLabels } from "@/app/utils/nameConvention";
import { ProductOrService } from "@/app/types";
import ProductOverview from "./ui/ProductOverview";
import ProductTechDetails from "./ui/ProductTechDetails";
import ReactConfetti from "react-confetti";
import Modal from "react-modal";
import { DescriptionAccordion } from "./ui/DescriptionAccordion";
import { apiFetch } from "@/app/utils/api-client";

interface CampaignProductsProps {
  product: ProductFetch;
}

interface CampaignProductsProps {
  product: ProductFetch;
  campaign: CampaignDetailsProps;
}

// Set the app element for react-modal for accessibility
// Using a try-catch to handle SSR and avoid errors if the #root element doesn't exist yet
try {
  if (typeof window !== "undefined") {
    Modal.setAppElement("#root");
  }
} catch (e) {
  // During SSR or if #root is not available, this will silently fail
  console.warn("Could not set app element for Modal");
}

const ProductDetails = ({ product, campaign }: CampaignProductsProps) => {
  const daysToGo = Math.max(
    Math.ceil((campaign.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)),
    0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // State for success notification
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Handle tab change
  const [isApproving, setIsApproving] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [productQuantity, setProductQuantity] = useState<number>(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [localProduct, setLocalProduct] = useState(product);
  const [isVerifying, setIsVerifying] = useState(false);
  const [localCampaign, setLocalCampaign] = useState(campaign);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  useEffect(() => {
    setLocalCampaign(campaign);
  }, [campaign]);

  // Success modal close handler
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Call handleResize initially to get accurate window size
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const commissionRate = 0.025; // 2.5%
  const [showCommissionInfo, setShowCommissionInfo] = useState<boolean>(false);
  const [calculatedAmount, setCalculatedAmount] = useState<{
    totalAmount: number;
    commissionAmount: number;
    finalAmount: number;
  }>({ totalAmount: 0, commissionAmount: 0, finalAmount: 0 });

  const items = [
    {
      key: "1",
      label: "Overview",
      children: <ProductOverview product={product} campaign={campaign} />,
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
              <div className="col-span-2 p-6 bg-gray-100 dark:bg-dark-surfaceHover rounded-lg text-center text-gray-500 dark:text-dark-textMuted">
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
      children: <ProductTechDetails campaign={campaign} />,
    },

    {
      key: "4",
      label: "Verification",
      children: (
        <div className="p-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                campaign.is_verified
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-dark-surfaceHover"
              }`}
            >
              {campaign.is_verified ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600 dark:text-green-400"
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
                  className="h-8 w-8 text-gray-400 dark:text-dark-textMuted"
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
            <span className="text-lg font-medium dark:text-dark-text">
              {campaign.is_verified ? "Verified Campaign" : "Not Verified"}
            </span>
            <p className="text-gray-600 dark:text-dark-textMuted text-center mt-2">
              {campaign.is_verified
                ? "This campaign has been verified by our team and meets all our standards."
                : "This campaign has not yet been verified by our team. Proceed with caution."}
            </p>
            {campaign.location && (
              <div className="mt-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 dark:text-dark-textMuted mr-2"
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
                <span className="dark:text-dark-textMuted">
                  {campaign.location}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const getCampaignAddress = async () => {
    const response = await apiFetch(
      `/api/getCampaignFromProduct?productId=${product.id}&fields=fundraiser_address`
    );
    const data = await response.json();

    return data.campaign.fundraiser_address;
  };

  const checkUSDCBalance = async () => {
    try {
      if (!address) return false;

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC.fuji,
        ABIS.USDC_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      /*       console.log("User USDC balance:", ethers.formatUnits(balance, 6));
       */
      return balance;
    } catch (error) {
      console.error("Error checking USDC balance:", error);
      return BigInt(0);
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

      const getCalculatedPrice = await apiFetch(
        `/api/calculateProductOrderPrice?productId=${product.productId}&quantity=${productQuantity}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const calculatedPrice = await getCalculatedPrice.json();
      console.log("Calculated price:", calculatedPrice);
      const totalPrice = ethers.parseUnits(
        calculatedPrice.totalPrice.toString(),
        6
      );

      // Check if user has enough USDC
      const usdcBalance = await checkUSDCBalance();
      if (usdcBalance < totalPrice) {
        const formattedBalance = ethers.formatUnits(usdcBalance, 6);
        const formattedPrice = ethers.formatUnits(totalPrice, 6);
        throw new Error(
          `Insufficient USDC balance. You have ${formattedBalance} USDC but need ${formattedPrice} USDC.`
        );
      }

      // Approve exact amount needed
      const txData = usdcContract.interface.encodeFunctionData("approve", [
        _campaignAddress,
        totalPrice,
      ]);

      const hash = await walletClient.sendTransaction({
        to: CONTRACTS.USDC.fuji as `0x${string}`,
        data: txData as `0x${string}`,
      });

      const receipt = await provider.waitForTransaction(hash as `0x${string}`);

      if (receipt?.status === 1) {
        //alert("Successfully approved USDC spending!");
        return true;
      } else {
        throw new Error("Approval transaction failed");
      }
    } catch (error) {
      console.error("Error approving USDC:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to approve USDC spending. Please try again."
      );
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const handleBackProject = async (): Promise<void> => {
    setIsLoading(true);

    if (!isConnected) {
      alert("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      alert(
        "Please accept the Terms and Conditions and Privacy Policy to continue"
      );
      setIsLoading(false);
      return;
    }

    if (productQuantity <= 0) {
      alert("Please enter a valid quantity");
      setIsLoading(false);
      return;
    }

    const commissionInfo = await calculateCommission(productQuantity);
    try {
      const _campaignAddress = await getCampaignAddress();
      console.log("Campaign address:", _campaignAddress);

      // Get the calculated price first
      const getCalculatedPrice = await apiFetch(
        `/api/calculateProductOrderPrice?productId=${product.productId}&quantity=${productQuantity}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const calculatedPrice = await getCalculatedPrice.json();
      const totalPrice = ethers.parseUnits(
        calculatedPrice.totalPrice.toString(),
        6
      );

      // Check if user has enough USDC
      const usdcBalance = await checkUSDCBalance();
      if (usdcBalance < totalPrice) {
        const formattedBalance = ethers.formatUnits(usdcBalance, 6);
        const formattedPrice = ethers.formatUnits(totalPrice, 6);
        alert(
          `Insufficient USDC balance. You have ${formattedBalance} USDC but need ${formattedPrice} USDC.`
        );
        setIsLoading(false);
        return;
      }

      // Proceed with approval and transaction
      const approved = await handleApprove(_campaignAddress);
      if (!approved) {
        setIsLoading(false);
        return;
      }

      // Call the API to prepare the transaction
      console.log("About to call /api/buyProduct with:", {
        campaignAddress: _campaignAddress,
        productId: product.productId,
        quantity: productQuantity,
      });

      const response = await apiFetch("/api/buyProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignAddress: _campaignAddress,
          productId: product.productId,
          quantity: productQuantity,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        let errorData: { error?: string; errorType?: string } = {};

        try {
          errorData = await response.json();
          console.log("Error data from backend:", errorData);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = { error: "Failed to parse error response" };
        }

        // Handle specific error types
        if (errorData.errorType === "CAMPAIGN_FINALIZED") {
          alert(
            "This campaign has been finalized and is no longer accepting contributions. Please check back for future campaigns!"
          );
          setIsLoading(false);
          return;
        } else if (errorData.errorType === "INSUFFICIENT_SUPPLY") {
          alert(
            "Sorry, there isn't enough supply remaining for this product. Please reduce your quantity or try another product."
          );
          setIsLoading(false);
          return;
        } else if (response.status === 404) {
          alert("Product not found. This product may no longer be available.");
          setIsLoading(false);
          return;
        } else {
          // Generic error handling with more details
          console.error("Unhandled API error:", {
            status: response.status,
            errorData,
            headers: Object.fromEntries(response.headers.entries()),
          });
          alert(
            `Failed to prepare transaction: ${
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`
            }`
          );
          setIsLoading(false);
          return;
        }
      }

      const data: { to: string; data: string } = await response.json();
      console.log("Transaction data:", data);

      if (!walletClient) {
        setIsLoading(false);
        throw new Error("Wallet not connected");
      }

      const hash = await walletClient.sendTransaction({
        to: data.to as `0x${string}`,
        data: data.data as `0x${string}`,
      });

      // Set verifying state after transaction is submitted
      setIsLoading(false);
      setIsVerifying(true);

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const receipt = await provider.waitForTransaction(hash);

      if (receipt?.status === 1) {
        // Show success notification with confetti
        setShowSuccessModal(true);
        setLocalProduct((prevProduct) => ({
          ...prevProduct,
          sold_count: (prevProduct.sold_count || 0) + productQuantity,
        }));
        console.log(commissionInfo);
        console.log(commissionInfo?.finalAmount);
        console.log(localCampaign.total_raised);
        console.log(
          (localCampaign.total_raised || 0) + (commissionInfo?.finalAmount || 0)
        );
        setLocalCampaign((prevCampaign) => ({
          ...prevCampaign,
          total_raised: Number(
            (
              (prevCampaign.total_raised || 0) +
              (commissionInfo?.finalAmount || 0)
            ).toFixed(3)
          ),
        }));
        // Refresh token balance after successful purchase
        await checkTokenBalance(_campaignAddress);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: unknown) {
      console.error("Error backing project:", error);

      // More specific error handling for different types of errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("user rejected")) {
        alert("Transaction was cancelled by user.");
      } else if (errorMessage.includes("insufficient funds")) {
        alert("Insufficient funds to complete the transaction.");
      } else if (errorMessage.includes("network")) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Failed to back project. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
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
        ethers.parseUnits(product.productId.toString(), 0)
      );
      setTokenBalance(balance);
      console.log("Token balance:", balance);
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

    if (productQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      setIsRefunding(true);
      const campaignAddress = await getCampaignAddress();
      const commissionInfo = await calculateCommission(productQuantity);

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

        setLocalProduct((prevProduct) => ({
          ...prevProduct,
          sold_count: (prevProduct.sold_count || 0) - productQuantity,
        }));

        setLocalCampaign((prevCampaign) => ({
          ...prevCampaign,
          total_raised: Number(
            (
              (prevCampaign.total_raised || 0) -
              (commissionInfo?.finalAmount || 0)
            ).toFixed(3)
          ),
        }));

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
      calculateCommission(value);
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

  const calculateCommission = async (quantity: number) => {
    if (quantity <= 0) return;

    try {
      // Get the calculated price first (reusing your existing API call)
      const getCalculatedPrice = await apiFetch(
        `/api/calculateProductOrderPrice?productId=${product.productId}&quantity=${quantity}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const calculatedPrice = await getCalculatedPrice.json();
      const totalAmount = parseFloat(calculatedPrice.totalPrice.toString());
      const commissionAmount = totalAmount * commissionRate;
      const finalAmount = totalAmount - commissionAmount;

      setCalculatedAmount({
        totalAmount,
        commissionAmount,
        finalAmount,
      });

      setShowCommissionInfo(true);

      return { totalAmount, commissionAmount, finalAmount };
    } catch (error) {
      console.error("Error calculating commission:", error);
    }
  };

  return (
    <main className="overflow-hidden p-8 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col min-h-0">
            <div className="relative w-full h-96 mb-6">
              <Image
                src={`${process.env.R2_BUCKET_URL}/product_logos/${product.logo}`}
                alt={product.name}
                fill
                className="object-contain rounded-xl shadow-lg"
                priority
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text break-words leading-tight">
                  {product.name}
                </h1>
              </div>
              <div className="overflow-hidden">
                <DescriptionAccordion
                  description={product.description}
                  maxChars={300}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-surface dark:to-dark-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border h-fit max-h-[900px] overflow-auto sticky top-0">
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-sm">
                <p className="text-gray-600 dark:text-dark-textMuted text-sm font-medium">
                  Funds Pledged
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${localCampaign.total_raised}
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-textMuted">
                  Pledged of ${localCampaign.fund_amount} campaign goal
                </p>
              </div>

              <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-sm">
                <p className="text-gray-600 dark:text-dark-textMuted text-sm font-medium">
                  Sold
                </p>
                <p className="text-3xl font-bold text-blueColorDull dark:text-dark-textMuted">
                  {localProduct.sold_count}
                </p>
              </div>

              <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-sm">
                <p className="text-lightBlueColor/80 dark:text-dark-textMuted text-sm font-medium">
                  Days to Go
                </p>
                <p className="text-3xl font-bold text-orangeColorDull dark:text-orangeColor">
                  {daysToGo}
                </p>
              </div>

              <div>
                <Input
                  placeholder="Enter quantity of items to purchase"
                  className="!border-2 !border-gray-300 dark:!border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text shadow-md shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 dark:placeholder:text-dark-textMuted placeholder:opacity-100 focus:!border-blueColor transition-colors duration-200"
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
                {showCommissionInfo && productQuantity > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-dark-surfaceHover dark:to-dark-surface rounded-lg border border-blue-200 dark:border-dark-border text-sm">
                    <p className="text-gray-700 dark:text-dark-text mb-3">
                      <strong className="text-blueColorDull dark:text-dark-textMuted">
                        Important:
                      </strong>{" "}
                      A 2.5% commission fee will be applied to your
                      contribution.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-textMuted">
                          Total contribution:
                        </span>
                        <span className="font-semibold dark:text-dark-text">
                          ${calculatedAmount.totalAmount.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-textMuted">
                          Commission (2.5%):
                        </span>
                        <span className="font-semibold text-red-600 dark:text-redColor">
                          ${calculatedAmount.commissionAmount.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 dark:text-green-400 pt-2 border-t border-blue-200 dark:border-dark-border">
                        <span>Campaign receives:</span>
                        <span>
                          ${calculatedAmount.finalAmount.toFixed(2)} USDC
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex items-start bg-white dark:bg-dark-surface p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4 text-blueColor focus:ring-blueColor border-gray-300 dark:border-dark-border dark:bg-dark-surfaceHover rounded"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm text-gray-700 dark:text-dark-text leading-relaxed"
                    >
                      I have read and agree to the{" "}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blueColor hover:underline font-medium dark:text-dark-textMuted"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blueColor hover:underline font-medium dark:text-dark-textMuted"
                      >
                        Privacy Policy.
                      </a>
                    </label>
                  </div>

                  <Link href="" className="w-full md:w-auto">
                    <CustomButton
                      onClick={handleBackProject}
                      disabled={
                        isLoading ||
                        isApproving ||
                        isVerifying ||
                        isRefunding ||
                        !acceptTerms
                      }
                      className={`py-3 md:py-4 hover:bg-blueColor/80 bg-blueColor text-white w-full font-semibold rounded-lg shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 ${
                        isLoading || isApproving || isVerifying || !acceptTerms
                          ? "opacity-50 cursor-not-allowed hover:transform-none"
                          : ""
                      }`}
                    >
                      {isApproving
                        ? "Approving USDC..."
                        : isLoading
                        ? "Generating transaction..."
                        : isVerifying
                        ? "Verifying..."
                        : "Back this Project"}
                    </CustomButton>
                  </Link>

                  {tokenBalance > 0 && (
                    <CustomButton
                      onClick={handleRefund}
                      disabled={
                        isRefunding ||
                        isLoading ||
                        isApproving ||
                        isVerifying ||
                        !acceptTerms
                      }
                      className={`py-3 md:py-4 hover:bg-redColor/80 bg-redColor text-white w-full font-semibold rounded-lg shadow-md border-redColorDull transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 ${
                        isRefunding ||
                        isLoading ||
                        isApproving ||
                        isVerifying ||
                        !acceptTerms
                          ? "opacity-50 cursor-not-allowed hover:transform-none"
                          : ""
                      }`}
                    >
                      {isRefunding || isLoading || isApproving || isVerifying
                        ? "Processing..."
                        : "Request Refund"}
                    </CustomButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-xl font-bold dark:text-dark-text">
              About this
              {productOrServiceLabels[product.type as ProductOrService] ||
                "Item"}
            </h2>
          </div>
          <Tabs
            tabPosition="left"
            items={items}
            defaultActiveKey="1"
            className="campaign-details-tabs my-4 custom-tab"
          />
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onRequestClose={closeSuccessModal}
        contentLabel="Purchase Successful"
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        ariaHideApp={false}
      >
        {showSuccessModal && (
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.1}
            tweenDuration={10000}
          />
        )}
        <div className="relative bg-white dark:bg-dark-surface w-11/12 max-w-md mx-auto rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mb-4 text-green-600 dark:text-green-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Purchase Successful!
            </h3>
            <p className="text-gray-600 dark:text-dark-textMuted mb-6">
              Congratulations! You`ve successfully backed this project. Thank
              you for your support!
            </p>
            <button
              onClick={closeSuccessModal}
              className="w-full bg-blueColor text-white font-medium py-2 px-4 rounded-lg hover:bg-blueColor/80 transition-colors focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default ProductDetails;
