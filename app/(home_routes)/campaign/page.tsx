import CampaignDetails from "@/app/components/campaign/CampaignDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
import React from "react";
interface Props {
  searchParams: { campaignId: string };
}

export default async function CampaignPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;
  const campaign = await fetchSingleCampaign(campaignId);
  return (
    <div>
      <CampaignDetails />
    </div>
  );
}
