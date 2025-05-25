import CampaignDetails from "@/app/components/campaign/CampaignDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
import React from "react";
import { getProducts } from "@/app/utils/poc_utils/getProducts";
import Head from "next/head";
interface Props {
  searchParams: { campaignId: string };
}

export default async function CampaignPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;

  const campaign = await fetchSingleCampaign(campaignId);
  if (!campaign) {
    return <div>Campaign not found</div>;
  }
  console.log(campaign, "campaignDetailsPAgesss");
  const plainCampaign = {
    ...campaign,
    _id: campaign._id.toString(),
    created_timestamp: campaign.created_timestamp?.toISOString(),
  };
  const products = await getProducts(campaignId);

  console.log(products, "products");

  return (
    <div>
      <Head>
        <title>{campaign.title}</title>
        <meta name="title" content={campaign.title} />
        <meta name="description" content={campaign.description} />

        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://poc.hexbox.money/campaign/${campaign.id}`}
        />
        <meta property="og:title" content={campaign.title} />
        <meta property="og:description" content={campaign.description} />
        <meta property="og:image" content={campaign.imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:url"
          content={`https://poc.hexbox.money/campaign/${campaign.id}`}
        />
        <meta name="twitter:title" content={campaign.title} />
        <meta name="twitter:description" content={campaign.description} />
        <meta name="twitter:image" content={campaign.imageUrl} />
      </Head>
      <CampaignDetails {...plainCampaign} products={products} />
    </div>
  );
}
