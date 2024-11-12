"use client";

import { CampaignItemProps } from "@/app/types";
import Image from "next/image";
import Link from "next/link";
import { SiSolana } from "react-icons/si";
const CampaignItem: React.FC<CampaignItemProps> = ({
  id,
  userId,
  title,

  fundAmount,
  logo,

  status,
}) => {
  return (
    <li className=" bg-none flex flex-col justify-between items-center shadow-sm hover:shadow-xl rounded-md overflow-hidden shadow-lightBlueColor transition-shadow duration-150 m-[10px] border-2 border-lightBlueColor">
      <Link className="contents" href={`/campaign?campaignId=${id}`}>
        <Image
          className="h-[170px] w-full object-cover object-center "
          loading="lazy"
          src={`${process.env.R2_BUCKET_URL}/campaign_logos/` + logo}
          alt={title}
          width={100}
          height={70}
        />

        <div className="w-full p-6 shadow-lightBlueColor">
          <h4 className="m-0 text-2xl font-bold truncate">{title}</h4>

          <div className="flex items-center justify-between mt-4 text-lg font-semibold">
            <span>Total</span>
            <span>Status</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <SiSolana className="h-5 w-5 text-blueColor" />
              <span className="text-xl">{fundAmount}</span>
            </div>
            <span className="text-lightBlueColor text-lg">{status}</span>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default CampaignItem;
