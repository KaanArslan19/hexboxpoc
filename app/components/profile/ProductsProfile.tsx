import { ProductFetch } from "@/app/types";
import React from "react";
import CampaignProducts from "../campaign/CampaignProducts";
interface Props {
  products: ProductFetch[];
  userId: string;
}
export default function ProductsProfile({ products, userId }: Props) {
  return (
    <div>
      <CampaignProducts userId={userId} products={products ? products : []} />
    </div>
  );
}
