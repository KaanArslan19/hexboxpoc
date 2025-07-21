import { CampaignDetailsProps } from "@/app/types";
import React from "react";
import CampaignItem from "../campaign/CampaignItem";

interface Props {
  campaigns:
    | {
        campaigns: CampaignDetailsProps[];
        total: number;
        limit: number;
        skip: number;
      }
    | CampaignDetailsProps[];
  userId: string;
}

export default function CampaignsProfile({ campaigns, userId }: Props) {
  const campaignsArray = Array.isArray(campaigns)
    ? campaigns
    : campaigns.campaigns;

  return (
    <div>
      <ul className="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {campaignsArray.map((item) => (
          <CampaignItem
            key={item._id}
            id={item._id}
            userId={item.user_id}
            one_liner={item.one_liner}
            title={item.title}
            fundAmount={item.fund_amount}
            logo={item.logo}
            status={item.status}
            total_raised={item.total_raised}
          />
        ))}
      </ul>
    </div>
  );
}
