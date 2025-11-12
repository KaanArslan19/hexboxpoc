import React from "react";
import { redirect } from "next/navigation";
import { getExecutorCampaign } from "@/app/utils/campaigns";
import UpdateCampaign from "@/app/components/campaign/UpdateCampaign";
import { FundingType, ProductOrService } from "@/app/types";
import { checkServerAuth } from "@/app/utils/CheckServerAuth";

interface Props {
  searchParams: { campaignId: string };
}

const fetchCampaignInfo = async (campaignId: string, userAddress: string) => {
  const campaign = await getExecutorCampaign(campaignId);
  if (!campaign) return redirect("/404");

  // CRITICAL: Server-side ownership validation
  if (campaign.user_id !== userAddress) {
    console.error(
      `Unauthorized access attempt: User ${userAddress} tried to access campaign ${campaignId} owned by ${campaign.user_id}`
    );
    return redirect("/unauthorized");
  }

  const finalCampaign = {
    _id: campaign._id.toString(),
    title: campaign.title,
    email: campaign.email || "",
    phoneNumber: campaign.phoneNumber || "",
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
    funds_management: campaign.funds_management,
  };

  return finalCampaign;
};

export default async function UpdatePage(props: Props) {
  const { campaignId } = props.searchParams;

  // Server-side authentication check
  const session = await checkServerAuth();

  if (!session.isAuthenticated || !session.address) {
    console.error("Unauthenticated user tried to access campaign update page");
    return redirect("/");
  }

  const campaign = await fetchCampaignInfo(campaignId, session.address);
  return <UpdateCampaign campaign={campaign} />;
}
