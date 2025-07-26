"use client";
import { Fragment, useState } from "react";
import CampaignItem from "./CampaignItem";
import { CampaignListProps } from "@/app/types";
import { fetchCampaigns } from "@/app/utils/apiHelpers";
import CustomButton from "../ui/CustomButton";

const CampaignList: React.FC<CampaignListProps> = ({
  listings,
  query,
  status,
  sortBy,
  sortOrder,
}) => {
  const [campaigns, setCampaigns] = useState(listings);
  const [skip, setSkip] = useState(listings.length);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 4;
  const loadMoreCampaigns = async () => {
    setLoading(true);
    try {
      const newCampaigns = await fetchCampaigns(
        limit,
        skip,
        query,
        status,
        sortBy,
        sortOrder
      );

      if (newCampaigns && newCampaigns.length > 0) {
        setCampaigns((prev) => [...prev, ...newCampaigns]);
        setSkip((prev) => prev + limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Fragment>
      <div className="flex flex-col items-center my-4 mx-2 sm:my-8 sm:mx-auto">
        <ul className="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {campaigns.map((item) => (
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
        <CustomButton
          onClick={loadMoreCampaigns}
          className="mt-6 w-full max-w-md sm:w-3/4 lg:w-1/2 bg-blueColorDull text-white hover:bg-blueColor border border-transparent disabled:opacity-50"
          disabled={!hasMore || loading}
        >
          {loading ? "Loading..." : hasMore ? "Load More" : "No more campaigns"}
        </CustomButton>
      </div>
    </Fragment>
  );
};

export default CampaignList;
