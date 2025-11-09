"use client";
import React from "react";
import Image from "next/image";
import { ProductFetch } from "@/app/types";
import { useRouter } from "next/navigation";
import { log } from "console";

const ProductCard: React.FC<ProductFetch> = ({
  id,
  name,
  description,
  price,
  inventory,
  logo,
  supply,
}) => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/product?productId=${id}`)}
      className="cursor-pointer bg-white dark:bg-dark-surfaceHover shadow-md rounded-2xl p-4 flex flex-col items-center hover:shadow-lg transition-shadow border border-gray-200 dark:border-dark-border"
    >
      <div className="relative w-28 h-28 mb-4">
        <Image
          src={`${process.env.R2_BUCKET_URL}/product_logos/${logo}`}
          alt={name}
          fill
          sizes="112px"
          className="object-contain rounded-md p-1"
        />
      </div>
      <h3 className="text-md font-bold text-gray-800 dark:text-white text-center truncate max-w-[90%] mb-2">
        {name}
      </h3>
      <span className="text-sm text-gray-600 dark:text-dark-textMuted text-center line-clamp-2 max-w-[90%] mb-4">
        {description}
      </span>
      <span className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        ${price.amount.toLocaleString()}
      </span>
      <span className="text-sm text-lightBlueColor dark:text-dark-text">
        Supply: {supply == 0 ? "Unlimited" : supply.toLocaleString()}
      </span>
    </div>
  );
};

export default ProductCard;
