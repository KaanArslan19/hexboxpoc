import { TokenDetailsProps } from "@/app/types";
import { getWalletTokenAddress } from "@/app/utils/poc_utils/getWalletTokenAddress";
import { ObjectId } from "mongodb";
import React from "react";

export default function CampaignActivity({
  name,
  supply,
  available_supply,
  holders,
  price,
  transactions,
}: TokenDetailsProps) {
  console.log(transactions);
  return (
    <div>
      {transactions.map((item, index) => (
        <div key={index}>
          <p>{item.address}</p>
          {item.amount}
          {item.type}
        </div>
      ))}
    </div>
  );
}
