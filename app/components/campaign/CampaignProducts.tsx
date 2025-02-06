"use client";
import React, { Fragment } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomButton from "@components/ui/CustomButton";
import Image from "next/image";
import { Product } from "@/app/types";

interface CampaignProductsProps {
  products: Product[];
  campaignId: string;
  userId: string;
}

const ProductCard: React.FC<Product> = ({
  id,
  name,
  description,
  price,
  supply,
  image,
}) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/product?productId=${id}`)}
      className="cursor-pointer bg-white shadow-md rounded-xl p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
    >
      <div className="relative w-28 h-28 mb-4">
        <Image
          src={`${process.env.R2_BUCKET_URL}/product_logos/${image}`}
          alt={name}
          layout="fill"
          className="object-contain rounded-md"
        />
      </div>
      <h3 className="text-md font-bold text-gray-800 text-center truncate max-w-full mb-2">
        {name}
      </h3>
      <span className="text-sm text-gray-600 text-center line-clamp-2 mb-4">
        {description}
      </span>
      <span className="text-lg font-semibold text-gray-900 mb-1">
        ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
      <span className="text-sm text-lightBlueColor">
        Supply: {supply.toLocaleString()}
      </span>
    </div>
  );
};

const CampaignProducts: React.FC<CampaignProductsProps> = ({
  products,
  campaignId,
  userId,
}) => {
  const { address } = useAccount();
  const campaignOwner = userId === address;

  return (
    <Fragment>
      <h2 className="text-xl lg:text-2xl mt-4 mb-4 text-center">
        Product Inventory
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
      {campaignOwner && (
        <div className="flex justify-end mt-6">
          <Link href={`/create-product?campaignId=${campaignId}`}>
            <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg">
              Create new Product
            </CustomButton>
          </Link>
        </div>
      )}
    </Fragment>
  );
};

export default CampaignProducts;
