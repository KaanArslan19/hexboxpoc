import { useAccount, useWalletClient, usePublicClient } from "wagmi";

export const createCampaignTransaction = async ({
  hash,
  campaignId
}: {
  hash: string;
  campaignId: string;
}) => {
  try {
    const response = await fetch("/api/confirmCreationOfCampaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionHash: hash,
        campaignId: campaignId
      }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in createCampaignTransaction:", error);
    throw error;
  }
};

