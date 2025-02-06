"use client";

import Image from "next/image";
import Link from "next/link";
import { FaDollarSign } from "react-icons/fa6";
import formatPrice from "@/app/utils/formatPrice";

import { NewProductInfo } from "@/app/types";
const ProductCard: React.FC<NewProductInfo> = ({
  image,
  name,
  description,
  price,
  supply,
}) => {
  return (
    <li className="bg-none flex flex-col justify-between items-center shadow-sm hover:shadow-xl rounded-md overflow-hidden shadow-lightBlueColor transition-shadow duration-150 m-[10px] border-2 border-lightBlueColor">
      <Link className="contents" href={`/product?productName=${name}`}>
        <Image
          className="h-[170px] w-full object-cover object-center"
          loading="lazy"
          src={`${process.env.R2_BUCKET_URL}/product_images/` + image}
          alt={name}
          width={100}
          height={70}
        />

        <div className="w-full p-6 shadow-lightBlueColor">
          <h4 className="m-0 text-2xl font-bold truncate">{name}</h4>
          <p className="mt-2 text-sm text-gray-500 truncate">{description}</p>

          <div className="flex items-center justify-between mt-4 text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <FaDollarSign />
              <span className="text-xl">{formatPrice(price)}</span>
            </div>
            <span className="text-blueColor text-lg capitalize">
              {supply > 0 ? `In Stock: ${supply}` : "Out of Stock"}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ProductCard;
