import CampaignDetails from "@/app/components/campaign/CampaignDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
import { getProducts } from "@/app/utils/poc_utils/getProducts";
import { Metadata, ResolvingMetadata } from "next";

interface Props {
  searchParams: { campaignId: string };
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const campaignId = searchParams.campaignId;
  const campaign = await fetchSingleCampaign(campaignId);

  if (!campaign) {
    return {
      title: "Campaign not found",
    };
  }

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/campaign?campaignId=${campaignId}`;

  return {
    title: campaign.title,
    description: campaign.description,
    openGraph: {
      title: campaign.title,
      description: campaign.description,
      url: url,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_R2_BUCKET_URL}/campaign_logos/${campaign.logo}`,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description: campaign.description,
      images: [
        {
          url: `${process.env.R2_BUCKET_URL}/campaign_logos/${campaign.logo}`,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
    },
  };
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
