"use client";
import React, { useEffect, useState, useCallback } from "react";
import CustomButton from "@/app/components/ui/CustomButton";
import Link from "next/link";
import CampaignList from "@/app/components/campaign/CampaignList";
import SearchForm from "@/app/components/SearchForm";
import CampaignFilter from "@/app/components/ui/CampaignFilter";
import { Status } from "@/app/components/ui/CampaignFilter";
import { useSearchParams } from "next/navigation";
import { fetchCampaigns } from "@/app/utils/apiHelpers";
import HexagonLoading from "@components/ui/HexagonLoading";

export default function CampaignsContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("query") || "";
  const status = (searchParams.get("status") as Status) || "active";
  const sortBy = searchParams.get("sortBy") || "total_raised";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCampaigns(
        10,
        0,
        query,
        status,
        sortBy,
        sortOrder
      );
      setCampaigns(result);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setError("Failed to load campaigns. Please try again.");
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl">
      <div className="text-center mt-16 mx-2">
        <div className="md:flex justify-between items-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-customFont_bold text-blueColorDull">
            {query ? `Search Results` : `Explore Campaigns`}
          </h1>
          <Link href="/campaign/create">
            <CustomButton className=" border-[1px] bg-blueColor text-white hover:bg-blueColor/90 w-3/4  md:w-full mt-4 md:mt-0">
              Create a Campaign
            </CustomButton>
          </Link>
        </div>
        <div className="flex flex-col w-full mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 mb-4">
            <div className="flex-none self-stretch">
              <CampaignFilter defaultStatus={status as Status} />
            </div>

            <div className="flex-1 min-w-0 self-stretch">
              <SearchForm />
            </div>
          </div>

          {query ? (
            <p className="mx-auto text-lg lg:text-xl mt-4">
              Showing results for:{" "}
              <span className="font-semibold">{query}</span>
            </p>
          ) : (
            <p className="mx-auto text-lg lg:text-xl mt-4 font-bold">
              Explore the projects that get funded by our precious community!
            </p>
          )}
        </div>
      </div>
      {error ? (
        <div className="text-center py-10 text-red-500">
          <p className="text-xl">{error}</p>
          <CustomButton
            onClick={fetchData}
            className="bg-blueColor text-white hover:bg-blueColor/80 py-2 md:py-4 w-full md:w-auto"
          >
            Retry
          </CustomButton>
        </div>
      ) : isLoading ? (
        <div className="h-screen flex items-center justify-center">
          <HexagonLoading />
        </div>
      ) : (
        <>
          {campaigns && campaigns.length > 0 ? (
            <>
              <div className="mb-4 text-left text-gray-600">
                {campaigns.length}{" "}
                {campaigns.length === 1 ? "campaign" : "campaigns"} found
              </div>
              <CampaignList
                listings={campaigns}
                key={`campaigns-${status}-${query}`}
              />
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl">
                No {status.toLowerCase()} campaigns found
                {query ? ` matching "${query}"` : ""}.
              </p>
              {query && (
                <p className="mt-4 text-gray-600">
                  Try using different keywords or checking your spelling.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
