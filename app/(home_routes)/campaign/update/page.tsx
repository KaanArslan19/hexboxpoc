import React from "react";
import { redirect } from "next/navigation";
import { getCampaign } from "@/app/utils/getCampaign";
import UpdateCampaign from "@/app/components/campaign/UpdateCampaign";
import { FundingType, ProductOrService } from "@/app/types";

interface Props {
  searchParams: { campaignId: string };
}

const fetchCampaignInfo = async (campaignId: string) => {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return redirect("/404");

  const finalCampaign = {
    _id: campaign._id.toString(),
    title: campaign.title,
    email: campaign.email,
    phoneNumber: campaign.phoneNumber,
    description: campaign.description,
    logo: campaign.logo,
    one_liner: campaign.one_liner,
    location: campaign.location,
    deadline: campaign.deadline,
    social_links: campaign.social_links,
    funding_type: campaign.funding_type,
    product_or_service: campaign.product_or_service,
    fund_amount: campaign.fund_amount,
    wallet_address: campaign.wallet_address,
  };

  return finalCampaign;
};

export default async function UpdatePage(props: Props) {
  const { campaignId } = props.searchParams;
  const campaign = await fetchCampaignInfo(campaignId);
  return <UpdateCampaign campaign={campaign} />;
}
