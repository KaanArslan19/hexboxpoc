import CampaignDetails from "@/app/components/campaign/CampaignDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
import React from "react";
import { getProducts } from "@/app/utils/poc_utils/getProducts";
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
  const products = await getProducts(campaignId);

  return (
    <div>
      <CampaignDetails {...plainCampaign} products={products} />
    </div>
  );
}
