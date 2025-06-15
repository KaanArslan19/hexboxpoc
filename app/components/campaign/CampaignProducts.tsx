"use client";
import React, { Fragment } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import CustomButton from "@components/ui/CustomButton";
import { ProductFetch } from "@/app/types";
import ProductCard from "../product/ProductCard";
interface CampaignProductsProps {
  products: ProductFetch[];
  campaignId?: string;
  userId: string;
}

const CampaignProducts: React.FC<CampaignProductsProps> = ({
  products,
  campaignId,
  userId,
}) => {
  const { address } = useAccount();
  const campaignOwner = userId === address;

  return (
    <Fragment>
      <h2 className="text-xl md:text-2xl mt-4 mb-4 text-center">
        Product Inventory
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-2 ">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {campaignOwner && (
        <div className="flex justify-end my-6 ">
          <Link href={`/create-product?campaignId=${campaignId}`}>
            <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg">
              Create a new Reward
            </CustomButton>
          </Link>
        </div>
      )}
    </Fragment>
  );
};

export default CampaignProducts;
