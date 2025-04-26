"use client";
import { CampaignItemProps } from "@/app/types";
import Image from "next/image";
import Link from "next/link";

import formatPrice from "@/app/utils/formatPrice";

const CampaignItem: React.FC<CampaignItemProps> = ({
  id,
  title,
  fundAmount,
  logo,
  status,
  total_raised,
}) => {
  return (
    <li className="bg-none flex flex-col justify-between items-center shadow-sm hover:shadow-xl rounded-2xl overflow-hidden shadow-lightBlueColor transition-shadow duration-150 m-[10px] border-[1px] border-lightBlueColor relative">
      <Link className="contents" href={`/campaign?campaignId=${id}`}>
        <Image
          className="h-[170px] w-full object-cover object-center"
          loading="lazy"
          src={`${process.env.R2_BUCKET_URL}/campaign_logos/` + logo}
          alt={title}
          width={100}
          height={70}
        />
        <div className="w-full p-6 shadow-lightBlueColor">
          <h4 className="m-0 text-2xl font-bold truncate">{title}</h4>

          <div className="my-4 p-2 bg-gray-50 rounded-lg border-l-4 border-blueColor">
            <p className="text-sm text-gray-500 mb-1">Total Raised</p>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blueColor">
                {formatPrice(total_raised)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-lg font-semibold">
            <span>Target</span>
            <span>Status</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{formatPrice(fundAmount)}</span>
            </div>
            <span className="text-blueColor text-lg capitalize">{status}</span>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default CampaignItem;
