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
    <div className="p-4">
      <div className="mb-4">
        <span className="font-semibold text-gray-800">Wallet Address</span>
        <div className="mt-1 p-3 bg-gray-100 rounded-md overflow-x-auto flex items-center">
          <code className="text-sm text-orangeColor">{walletAddress}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="group relative ml-2 p-1 flex items-center justify-center"
          >
            <TiAttachment className="w-6 h-6 text-blueColor" />

            <span className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTechDetails;
