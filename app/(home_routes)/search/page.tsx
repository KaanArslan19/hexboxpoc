import { redirect } from "next/navigation";
import { fetchCampaigns } from "@/app/utils/apiHelpers";
import CampaignsContent from "@/app/components/CampaignsContent";
import { Status } from "@/app/components/ui/CampaignFilter";

interface SearchPageProps {
  searchParams: {
    query?: string;
    status?: Status;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    query,
    status,
    sortBy = "total_raised",
    sortOrder = "desc",
  } = searchParams;

  if (
    !query &&
    (!status || status === "active") &&
    sortBy === "total_raised" &&
    sortOrder === "desc"
  ) {
    redirect("/campaigns");
  }

  return <CampaignsContent />;
}
