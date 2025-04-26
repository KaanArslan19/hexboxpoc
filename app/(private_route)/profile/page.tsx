import { fetchCampaignsByUser } from "@/app/utils/apiHelpers";
import ProfilePageClient from "@/app/components/profile/ProfilePageClient";
import { CampaignDetailsProps } from "@/app/types";
import { getUserProducts } from "@/app/utils/poc_utils/getUserProducts";
interface Props {
  searchParams: { userId: string };
}

export default async function ProfilePage({ searchParams }: Props) {
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

  // Calculate real dashboard statistics
  const totalFundsRaised = campaigns.reduce(
    (sum: number, campaign: CampaignDetailsProps) => {
      return sum + (parseFloat(campaign.total_raised?.toString() || "0") || 0);
    },
    0
  );

  /*   // Count unique backer IDs across all campaigns
  const allBackerIds = new Set();
  campaigns.forEach((campaign) => {
    // Assuming each campaign has a backers array with backer IDs
    // Modify this logic based on your actual data structure
    if (campaign.backers && Array.isArray(campaign.backers)) {
      campaign.backers.forEach((backer) => {
        allBackerIds.add(backer.id || backer);
      });
    }
  });
  const activeBackers = allBackerIds.size; */

  // Count successful campaigns
  const successfulCampaigns = campaigns.filter(
    (campaign: CampaignDetailsProps) => campaign.status === "Completed"
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
      products={products}
      dashboardStats={dashboardStats}
    />
  );
}
