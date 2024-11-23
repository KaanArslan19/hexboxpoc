import CampaignDetails from "@/app/components/campaign/CampaignDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
import React from "react";
interface Props {
  searchParams: { campaignId: string };
}

export default async function CampaignPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;
  const campaign = await fetchSingleCampaign(campaignId);
  if (!campaign) {
    return <div>Campaign not found</div>;
  }
  const plainCampaign = {
    ...campaign,
    _id: campaign._id.toString(),
    created_timestamp: campaign.created_timestamp?.toISOString(),
  };
  return (
    <div>
      <CampaignDetails {...plainCampaign} />
    </div>
  );
}
