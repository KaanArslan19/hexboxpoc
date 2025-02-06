"use client";
import Image from "next/image";
import { Product } from "@/app/types";
import Link from "next/link";
import CustomButton from "./ui/CustomButton";
interface CampaignProductsProps {
  product: Product;
}

const ProductDetails = ({ product }: CampaignProductsProps) => {
  console.log(product);
  return (
    <main className="p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative w-full h-96">
              <Image
                src={`${process.env.R2_BUCKET_URL}/product_logos/${product.image}`}
                alt={product.name}
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold mt-6 mb-4">{product.name}</h1>
            <p className="text-lg text-gray-700">{product.description}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm">Funds Pledged</p>
                <p className="text-3xl font-bold">AU$676,830</p>
                <p className="text-sm text-gray-600">
                  pledged of fundAmount of campaign goal
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Backers</p>
                <p className="text-3xl font-bold">2,714</p>
              </div>
              <div>
                <p className="text-lightBlueColor/80 text-sm">Days to Go</p>
                <p className="text-3xl font-bold">36</p>
              </div>
              <Link href="" className="w-full md:w-auto">
                <CustomButton className="py-2 md:py-4 hover:bg-blueColor/80 bg-blueColor text-white w-full md:w-auto mt-2">
                  Back this Project
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Project We Love</h2>
          <p className="text-gray-700">
            This project will only be funded if it reaches its goal by campaign
            end date
          </p>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
