import CampaignList from "@/app/components/campaign/CampaignList";
import React from "react";
import CustomButton from "@/app/components/ui/CustomButton";
import Link from "next/link";
import { fetchCampaigns } from "@/app/utils/apiHelpers";

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns(10, 0);

  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl">
      <div className="text-center mt-16 mx-2">
        <div className="md:flex justify-between items-center mb-4">
          <h1 className="text-4xl lg:text-5xl font-customFont_bold tracking-tight  mb-4 ">
            Explore Campaigns
          </h1>
          <Link href="/create">
            <CustomButton className="bg-none border-[1px] border-blueColor w-3/4 md:w-full">
              Create a Campaign
            </CustomButton>
          </Link>
        </div>

        <p className="mx-auto text-lg lg:text-xl">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum
          dolorem nobis quibusdam deserunt temporibus neque, quo et delectus
          ullam quos, iste recusandae distinctio repellat! At labore excepturi
          est saepe laudantium.
        </p>
      </div>
      <CampaignList listings={campaigns} />
    </div>
  );
}
