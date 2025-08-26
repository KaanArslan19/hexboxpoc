"use client";
import { CampaignItemProps } from "@/app/types";
import Image from "next/image";
import Link from "next/link";
import formatPrice from "@/app/utils/formatPrice";
import { CheckCircle, LockIcon } from "lucide-react";

const CampaignItem: React.FC<CampaignItemProps> = ({
  id,
  title,
  fundAmount,
  logo,
  status,
  total_raised,
}) => {
  const isFinalized = status === "finalized";

  return (
    <li
      className={`bg-none flex flex-col justify-between items-center shadow-sm hover:shadow-xl rounded-2xl overflow-hidden transition-shadow duration-150 m-[10px] border-[1px] relative
        ${
          isFinalized
            ? "border-gray-300 opacity-90 grayscale-[30%]"
            : "border-lightBlueColor shadow-lightBlueColor"
        }`}
    >
      <Link className="contents" href={`/campaign?campaignId=${id}`}>
        {isFinalized && (
          <div className="absolute top-4 right-4 z-10 bg-gray-800 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm font-medium">
            <LockIcon size={14} />
            <span>Finalized</span>
          </div>
        )}
        <Image
          className="h-[170px] w-full object-contain object-center"
          loading="lazy"
          src={`${process.env.R2_BUCKET_URL}/campaign_logos/` + logo}
          alt={title}
          width={100}
          height={70}
        />
        <div
          className={`w-full p-6 ${
            isFinalized ? "bg-gray-50" : "shadow-lightBlueColor"
          }`}
        >
          <h4 className="m-0 text-2xl font-bold truncate text-gray-900">
            {title}
          </h4>
          <div
            className={`my-4 p-2 rounded-lg border-l-4 ${
              isFinalized
                ? "bg-gray-100 border-gray-400"
                : "bg-gray-50 border-blueColor"
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Total Raised</p>
            <div className="flex items-center">
              <span
                className={`text-2xl font-bold  ${
                  isFinalized ? "text-gray-600" : "text-blueColor"
                }`}
              >
                {formatPrice(total_raised)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-lg font-semibold text-gray-900">
            <span>Target</span>
            <span>Status</span>
          </div>
          <div className="flex items-center justify-between mt-3 gap-4">
            <div className="flex items-center space-x-2 truncate max-w-full">
              <span className="text-xl text-gray-900">
                {formatPrice(fundAmount)}
              </span>
            </div>
            <span
              className={`text-lg capitalize flex items-center ${
                isFinalized ? "text-gray-600" : "text-blueColor"
              }`}
            >
              {status}
              {isFinalized && (
                <CheckCircle size={18} className="ml-1 text-gray-500" />
              )}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default CampaignItem;
