import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import apiFetch from "@/app/utils/api-client";

export const createCampaignTransaction = async ({
  hash,
  campaignId
}: {
  hash: string;
  campaignId: string;
}) => {
  try {
    // Use apiFetch which automatically handles 401 unauthorized responses
    const response = await apiFetch("/api/confirmCreationOfCampaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionHash: hash,
        campaignId: campaignId
      }),
    });

    // For non-success status codes other than 401 (which is handled by apiFetch)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in createCampaignTransaction:", error);
    throw error;
  }
};

