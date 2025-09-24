"use client";
import { TiAttachment } from "react-icons/ti";
import { useState } from "react";
import { CampaignDetailsProps } from "@/app/types";
interface CampaignProductsProps {
  campaign?: CampaignDetailsProps;
  wallet_address?: string;
}
const ProductTechDetails = ({
  campaign,
  wallet_address,
}: CampaignProductsProps) => {
  const [copied, setCopied] = useState(false);

  const walletAddress = campaign
    ? campaign.wallet_address || campaign.user_id
    : wallet_address;

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-4 text-black dark:text-dark-text">
      <div className="mb-4">
        <span className="font-semibold text-gray-800 dark:text-dark-text">
          Wallet Address
        </span>
        <div className="mt-1 p-3 bg-gray-100 dark:bg-dark-surface border border-transparent dark:border-dark-border rounded-md overflow-x-auto flex items-center">
          <code className="text-sm text-orangeColor dark:text-dark-text">
            {walletAddress}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="group relative ml-2 p-1 flex items-center justify-center"
          >
            <TiAttachment className="w-6 h-6 text-blueColor dark:text-dark-text" />

            <span className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-dark-surface text-white dark:text-dark-text text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none border dark:border-dark-border">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTechDetails;
