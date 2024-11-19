import { getWalletTokenAddress } from "@/app/utils/poc_utils/getWalletTokenAddress";
import { ObjectId } from "mongodb";
import React from "react";
interface Props {
  _id: ObjectId;
  name: string;
  supply: number;
  available_supply: number;
  price: number;
  holders: [{ address: string; balance: number }];
  transactions: [
    {
      address: string;
      type: string;
      amount: number;
    }
  ];
}
export default function CampaignActivity({
  _id,
  name,
  supply,
  available_supply,
  holders,
  price,
  transactions,
}: Props) {
  console.log(transactions);
  return <div></div>;
}
