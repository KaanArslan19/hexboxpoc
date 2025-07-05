"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Status = "active" | "verified" | "finalized" | "All";

interface CampaignFilterProps {
  defaultStatus?: Status;
}

export default function CampaignFilter({
  defaultStatus = "active",
}: CampaignFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("query") || "";
  const sortBy = searchParams.get("sortBy") || "total_raised";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const initialStatus = (searchParams.get("status") as Status) || defaultStatus;
  const [selectedStatus, setSelectedStatus] = useState<Status>(initialStatus);

  const handleStatusChange = (status: Status) => {
    setSelectedStatus(status);
    const params = new URLSearchParams();

    if (currentQuery) params.set("query", currentQuery);
    if (sortBy !== "total_raised") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    if (status === "All") {
      params.set("status", "All"); // Explicitly include "All" in URL
    } else {
      params.set("status", status);
    }

    const url = `/search?${params.toString()}`;
    console.log("Navigating to:", url);
    router.push(url);
  };

  const statuses: Status[] = ["active", "verified", "finalized", "All"];

  return (
    <div className="flex flex-wrap items-stretch h-full gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all 
            ${
              selectedStatus === status
                ? "bg-gradient-to-r from-lightBlueColor to-blueColor/80 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
          type="button"
        >
          {status}
        </button>
      ))}
    </div>
  );
}
