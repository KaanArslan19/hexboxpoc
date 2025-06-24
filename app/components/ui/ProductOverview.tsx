import React from "react";
import { FundingType, ProductOrService } from "@/app/types";
import {
  fundingTypeLabels,
  productOrServiceLabels,
} from "@/app/utils/nameConvention";
import { ProductFetch, CampaignDetailsProps } from "@/app/types";
import Link from "next/link";
import CustomButton from "./CustomButton";
import { DescriptionAccordion } from "./DescriptionAccordion";

export default function ProductOverview({
  product,
  campaign,
}: {
  product: ProductFetch;
  campaign: CampaignDetailsProps;
}) {
  console.log(product.fulfillmentDetails, "product");
  return (
    <div className="p-6 bg-white  border-gray-100">
      <div className="text-gray-700 mb-6 text-lg leading-relaxed">
        <DescriptionAccordion
          description={product.description}
          maxChars={300}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-blueColor/10 p-4 rounded-lg border-l-4 border-blueColor/80 shadow-sm hover:shadow-md transition-shadow">
          <span className="font-customFont_extrabold text-gray-800 block mb-2">
            Funding Type
          </span>
          <p className="text-blueColorDull font-customFont_regular ">
            {fundingTypeLabels[campaign.funding_type as FundingType]}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400 shadow-sm hover:shadow-md transition-shadow">
          <span className="font-customFont_extrabold text-gray-800 block mb-2">
            Status
          </span>
          <p className="flex items-center">
            <span
              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                campaign.status === "active"
                  ? "bg-green-500"
                  : campaign.status === "finalized"
                  ? "bg-redColorDull"
                  : "bg-yellowColorDull"
              }`}
            ></span>
            <span
              className={`font-customFont_regular ${
                campaign.status === "active"
                  ? "text-green-700"
                  : campaign.status === "finalized"
                  ? "text-redColorDull"
                  : "text-yellowColorDull"
              }`}
            >
              {campaign.status}
            </span>
          </p>
        </div>

        <div className="bg-orangeColor/20 p-4 rounded-lg border-l-4 border-orangeColor/80 shadow-sm hover:shadow-md transition-shadow">
          <span className="font-customFont_extrabold text-gray-800 block mb-2">
            Item Type
          </span>
          <p className="text-orangeColorDull font-customFont_regular">
            {productOrServiceLabels[product.type as ProductOrService] || "Item"}
          </p>
        </div>

        <div className="bg-blueColor/10 p-4 rounded-lg border-l-4 border-blueColor/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
          <span className="font-customFont_extrabold text-gray-800 block mb-2">
            Smart Contract
          </span>
          <Link
            href={`https://testnet.snowtrace.io/nft/0x49216924D47184954e25940a6352abc4b03AbAeD/${product.productId}?chainid=43113&type=erc1155`}
            target="_blank"
            className="w-full"
          >
            <CustomButton className="py-3 px-6 w-full bg-blueColor hover:bg-blueColor/80 text-white rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              View Contract Details
            </CustomButton>
          </Link>
        </div>

        {product.fulfillmentDetails && (
          <div className="bg-blueColor/10 p-4 rounded-lg border-l-4 border-blueColor/80 shadow-sm hover:shadow-md transition-shadow">
            <span className="font-customFont_extrabold text-gray-800 block mb-2">
              Fulfillment Details
            </span>
            <DescriptionAccordion
              description={product.fulfillmentDetails}
              maxChars={100}
            />
          </div>
        )}

        {product.deliveryDate && (
          <div className="bg-orangeColor/20 p-4 rounded-lg border-l-4 border-orangeColor/80  shadow-sm hover:shadow-md transition-shadow max-h-[100px]">
            <span className="font-customFont_extrabold text-gray-800 block mb-2">
              Expected Delivery Date
            </span>
            <p className="text-purpleColorDull font-customFont_regular">
              {new Date(product.deliveryDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
        <p className="text-sm text-gray-600">
          This contract is deployed on the Avalanche Testnet. Inspect the NFT
          details to learn more about this project`s tokenomics.
        </p>
      </div>
    </div>
  );
}
