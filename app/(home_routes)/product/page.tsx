import { ProductFetch } from "@/app/types";
import React from "react";
import { getProduct } from "@/app/utils/poc_utils/getProduct";
import ProductDetails from "@/app/components/ProductDetails";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";
interface Props {
  searchParams: { productId: string };
}

export default async function ProductDetailsPage({ searchParams }: Props) {
  const productId = searchParams.productId;

  if (!productId) {
    console.error("No product ID provided in search params");
    return null;
  }

  const product: ProductFetch | null = await getProduct(productId);

  if (!product) {
    console.error("Product not found with the given ID:", productId);
    return <div>Product not found</div>;
  }
  const campaign = await fetchSingleCampaign(product.campaignId);
  console.log(campaign);
  const plainCampaign = {
    ...campaign,
    _id: campaign._id.toString(),
    created_timestamp: campaign.created_timestamp?.toISOString(),
  };
  console.log("campaign---", plainCampaign);
  return <ProductDetails campaign={plainCampaign} product={product} />;
}
