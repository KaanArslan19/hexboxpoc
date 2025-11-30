import { ProductFetch } from "@/app/types";
import React from "react";
import { getProduct } from "@/app/utils/poc_utils/getProduct";
import ProductDetails from "@/app/components/ProductDetails";
import {getPublicCampaign} from "@/app/utils/campaigns";

interface Props {
  searchParams: { productId: string };
}

export default async function ProductDetailsPage({ searchParams }: Props) {
  const productId = searchParams?.productId;

  if (!productId) {
    return (
      <div className="text-center text-redColor py-8">
        No product ID provided in the URL.
      </div>
    );
  }

  let product: ProductFetch | null = null;
  try {
    product = await getProduct(productId);
  } catch (err) {
    return (
      <div className="text-center text-redColor py-8">
        Invalid product ID format.
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center text-redColor py-8">
        Product not found for the given ID.
      </div>
    );
  }

  let campaign = null;
  try {
    campaign = await getPublicCampaign(product.campaignId);
  } catch (err) {
    return (
      <div className="text-center text-redColor py-8">
        Failed to load campaign for this product.
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center text-redColor py-8">
        Campaign not found for this product.
      </div>
    );
  }

  const plainCampaign = {
    ...(campaign as any),
    _id: campaign._id.toString(),
    created_timestamp: campaign.created_timestamp?.toISOString(),
  };
  return <ProductDetails campaign={plainCampaign} product={product} />;
}
