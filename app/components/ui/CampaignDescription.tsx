import React from "react";

export default function CampaignDescription({ description }: any) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <h2 className="text-xl lg:text-2xl mt-4 mb-2 text-center">
        Story of the Campaign
      </h2>
      {description}
    </div>
  );
}
