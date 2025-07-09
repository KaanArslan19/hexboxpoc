import React from "react";

import { fetchCampaignsByUser, fetchCampaigns } from "@/app/utils/apiHelpers";
import ProfilePageClient from "@/app/components/profile/ProfilePageClient";
import { CampaignDetailsProps } from "@/app/types";
import { getUserProducts } from "@/app/utils/poc_utils/getUserProducts";
import { getAllProducts } from "@/app/utils/poc_utils/getProducts";
interface Props {
  searchParams: { userId: string };
}

export default async function ExecutorPage({ searchParams }: Props) {
  console.log(searchParams, "searchParams");

  const userId = searchParams?.userId;
  if (!userId) {
    return <p>User ID is required</p>;
  }
  const campaignsData = await fetchCampaignsByUser(userId);
  // Extract the campaigns array from the response object
  const campaigns = Array.isArray(campaignsData)
    ? campaignsData
    : campaignsData.campaigns;

  const products = await getUserProducts(userId);
  const allCampaigns = await fetchCampaigns(1000, 0, undefined, "All");
  const allProducts = await getAllProducts();

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
