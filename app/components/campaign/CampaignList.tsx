"use client";
import { Fragment, useState } from "react";
import CampaignItem from "./CampaignItem";
import { CampaignListProps } from "@/app/types";
import { fetchCampaigns } from "@/app/utils/apiHelpers";
import CustomButton from "../ui/CustomButton";

const CampaignList: React.FC<CampaignListProps> = ({ listings }) => {
  const [campaigns, setCampaigns] = useState(listings);
  const [skip, setSkip] = useState(listings.length);
  const [hasMore, setHasMore] = useState(true); //
  const limit = 10;
  const loadMoreCampaigns = async () => {
    console.log("Load more triggered with skip:", skip);

    try {
      const newCampaigns = await fetchCampaigns(limit, skip);
      console.log("Fetched new campaigns:", newCampaigns);

      if (newCampaigns && newCampaigns.length > 0) {
        setCampaigns((prev) => [...prev, ...newCampaigns]);
        setSkip((prev) => prev + limit);
      } else {
        console.log("No more campaigns to load");
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more campaigns:", error);
      setHasMore(false);
    }
  };
  console.log(hasMore);
  return (
    <Fragment>
      <div className="flex flex-col items-center my-8  mx-auto ">
        <ul className="sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
          {campaigns.map((item) => (
            <CampaignItem
              key={item._id}
              id={item._id}
              userId={item.user_id}
              title={item.title}
              description={item.description}
              fundAmount={item.fund_amount}
              logo={item.logo}
              backgroundImage={item.background_image}
              hexboxAddress={item.hexbox_address}
              /*               status={item.status}
               */
            />
          ))}
        </ul>
        <CustomButton
          onClick={loadMoreCampaigns}
          className="bg-none border-[1px] border-blueColor w-2/4 md:w-3/4 "
          disabled={!hasMore}
        >
          {hasMore ? "Load More" : "No more campaigns"}{" "}
        </CustomButton>
      </div>
    </Fragment>
  );
};

export default CampaignList;
