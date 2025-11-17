"use client";
import { TiAttachment } from "react-icons/ti";
import { useState } from "react";
import {
  CampaignDetailsProps,
  FundsManagement,
  FundsManagementHistoryEntry,
} from "@/app/types";
interface CampaignProductsProps {
  campaign?: CampaignDetailsProps;
  wallet_address?: string;
  funds_management?: FundsManagement;
}
const ProductTechDetails = ({
  campaign,
  wallet_address,
  funds_management,
}: CampaignProductsProps) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const walletAddress = campaign
    ? campaign.wallet_address || campaign.user_id
    : wallet_address;

  const fundsManagementData: FundsManagement = campaign
    ? campaign.funds_management
    : funds_management || "";

  // Helper function to normalize funds_management to array format
  const normalizeToHistoryArray = (
    data: FundsManagement
  ): FundsManagementHistoryEntry[] => {
    if (!data) return [];

    // If it's already an array, return it
    if (Array.isArray(data)) {
      return data;
    }

    // If it's a string (legacy format), convert to array with current timestamp
    if (typeof data === "string" && data.trim()) {
      return [
        {
          text: data,
          timestamp: Date.now(), // Use current time as fallback for legacy entries
        },
      ];
    }

    return [];
  };

  const historyArray = normalizeToHistoryArray(fundsManagementData);
  const currentEntry =
    historyArray.length > 0 ? historyArray[historyArray.length - 1] : null;
  const hasHistory = historyArray.length > 1;

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

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

      {currentEntry && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800 dark:text-dark-text">
              Funds Management
            </span>
            {hasHistory && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blueColor dark:text-dark-textMuted hover:underline"
              >
                {showHistory ? "Hide History" : "Show History"}
              </button>
            )}
          </div>
          <div className="mt-1 p-3 bg-gray-100 dark:bg-dark-surface border border-transparent dark:border-dark-border rounded-md">
            <p className="text-sm text-gray-700 dark:text-dark-textMuted leading-relaxed">
              {currentEntry.text}
            </p>
            {currentEntry.timestamp && (
              <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-2">
                Last updated: {formatDate(currentEntry.timestamp)}
              </p>
            )}
          </div>

          {showHistory && hasHistory && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-surfaceHover border border-gray-200 dark:border-dark-border rounded-lg">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-dark-text mb-4">
                Change History ({historyArray.length}{" "}
                {historyArray.length === 1 ? "entry" : "entries"})
              </h4>
              <div className="space-y-4">
                {[...historyArray].reverse().map((entry, index) => {
                  const entryNumber = historyArray.length - index;
                  const isLatest = index === 0;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-md border-2 ${
                        isLatest
                          ? "bg-lightBlueColor dark:bg-lightBlueColorDull border-blueColor dark:border-blueColorDull"
                          : "bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border"
                      } shadow-sm`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isLatest
                              ? "bg-blueColor text-white"
                              : "bg-textMuted/30 dark:bg-dark-surfaceHover text-textPrimary dark:text-dark-textMuted"
                          }`}
                        >
                          {entryNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-textPrimary dark:text-dark-textMuted leading-relaxed mb-2">
                            {entry.text}
                          </p>
                          {entry.timestamp && (
                            <p className="text-xs text-textMuted dark:text-dark-textMuted font-medium">
                              {formatDate(entry.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductTechDetails;
