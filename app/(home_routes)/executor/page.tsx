import React from "react";

import { fetchCampaignsByUser, fetchCampaigns } from "@/app/utils/apiHelpers";
import ProfilePageClient from "@/app/components/profile/ProfilePageClient";
import { CampaignDetailsProps } from "@/app/types";
import { getUserProducts } from "@/app/utils/poc_utils/getUserProducts";
import { getAllProducts } from "@/app/utils/poc_utils/getProducts";
import { ErrorMessage } from "@/app/components/ui/ErrorMessage";
interface Props {
  searchParams: { userId: string };
}

export default async function ExecutorPage({ searchParams }: Props) {
  console.log(searchParams, "searchParams");

  const userId = searchParams?.userId;
  if (!userId) {
    return (
      <ErrorMessage
        title="User ID Required"
        message="No user ID was provided in the URL. Please check the link or log in again."
      />
    );
  }
  let campaignsData, campaigns, products, allCampaigns, allProducts;
  try {
    campaignsData = await fetchCampaignsByUser(userId);
    campaigns = Array.isArray(campaignsData)
      ? campaignsData
      : campaignsData.campaigns;
    products = await getUserProducts(userId);
    allCampaigns = await fetchCampaigns(1000, 0, undefined, "All");
    allProducts = await getAllProducts();
  } catch (error: any) {
    return (
      <ErrorMessage
        title="Failed to Load Profile"
        message={
          error?.message ||
          "There was an error loading this profile. Please check the user ID or try again later."
        }
        showRetry
      />
    );
  }
  if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
    return (
      <ErrorMessage
        title="No Campaigns Found"
        message="No campaigns were found for this user. The user ID may be incorrect or the user has not created any campaigns."
      />
    );
  }

  // Calculate real dashboard statistics
  const totalFundsRaised = campaigns.reduce(
    (sum: number, campaign: CampaignDetailsProps) => {
      return sum + (parseFloat(campaign.total_raised?.toString() || "0") || 0);
    },
    0
  );

  // Count successful campaigns
  const successfulCampaigns = campaigns.filter(
    (campaign: CampaignDetailsProps) => campaign.status === "finalized"
  ).length;

  // Calculate products sold (if this data is available)
  const productsSold =
    products?.reduce((sum, product) => {
      return sum + (product.sold_count || 0);
    }, 0) || 0;

  const walletBalance = 3.45; // will be replaced with actual wallet balance

  const dashboardStats = {
    totalFundsRaised,
    activeBackers: 0,
    successfulCampaigns,
    productsSold,
    walletBalance,
  };

  return (
    <ProfilePageClient
      userId={userId}
      campaigns={campaigns}
      allCampaigns={allCampaigns}
      products={products}
      allProducts={allProducts}
      dashboardStats={dashboardStats}
    />
  );
}
