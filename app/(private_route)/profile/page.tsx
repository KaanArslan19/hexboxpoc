import { fetchCampaigns, fetchCampaignsByUser } from "@/app/utils/apiHelpers";
import ProfilePageClient from "@/app/components/profile/ProfilePageClient";
import { CampaignDetailsProps } from "@/app/types";
import { getUserProducts } from "@/app/utils/poc_utils/getUserProducts";
import { getAllProducts } from "@/app/utils/poc_utils/getProducts";
interface Props {
  searchParams: { userId: string };
}

export default async function ProfilePage({ searchParams }: Props) {
  const userId = searchParams?.userId;
  if (!userId) {
    return <p>User ID is required</p>;
  }

  const allCampaigns = await fetchCampaigns(1000, 0, undefined, "All");
  const campaignsData = await fetchCampaignsByUser(userId);

  const campaigns = Array.isArray(campaignsData)
    ? campaignsData
    : campaignsData.campaigns;

  const allProducts = await getAllProducts();
  const products = await getUserProducts(userId);

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
