import { fetchCampaigns, fetchCampaignsByUser } from "@/app/utils/apiHelpers";
import ProfilePageClient from "@/app/components/profile/ProfilePageClient";
import { CampaignDetailsProps } from "@/app/types";
import { getUserProducts } from "@/app/utils/poc_utils/getUserProducts";
import { getAllProducts } from "@/app/utils/poc_utils/getProducts";
import { ErrorMessage } from "@/app/components/ui/ErrorMessage";
interface Props {
  searchParams: { userId: string };
}

export default async function ProfilePage({ searchParams }: Props) {
  const userId = searchParams?.userId;
  if (!userId) {
    return (
      <ErrorMessage
        title="User ID Required"
        message="No user ID was provided in the URL. Please check the link or log in again."
      />
    );
  }
  let allCampaigns, campaignsData, campaigns, allProducts, products;
  try {
    allCampaigns = await fetchCampaigns(1000, 0, undefined, "All");
    campaignsData = await fetchCampaignsByUser(userId);
    campaigns = Array.isArray(campaignsData)
      ? campaignsData
      : campaignsData.campaigns;
    allProducts = await getAllProducts();
    products = await getUserProducts(userId);
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

  const successfulCampaigns = campaigns.filter(
    (campaign: CampaignDetailsProps) => campaign.status === "finalized"
  ).length;

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
