import { CampaignItemProps, Product } from "@/app/types";
import React from "react";
import { getProduct } from "@/app/utils/poc_utils/getProduct";
import ProductDetails from "@/app/components/ProductDetails";
import { getCampaign } from "@/app/utils/getCampaign";
interface Props {
  searchParams: { productId: string };
}

export default async function ProductDetailsPage({ searchParams }: Props) {
  const productId = searchParams.productId;

  if (!productId) {
    console.error("No product ID provided in search params");
    return null;
  }

  const product: Product | null = await getProduct(productId);

  if (!product) {
    console.error("Product not found with the given ID:", productId);
    return <div>Product not found</div>;
  }

  return <ProductDetails product={product} />;
}
