import React, { useEffect, useState } from "react";
import HexagonImage from "../ui/HexagonImage";
import { FaDiscord, FaLinkedin } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
import CampaignTabs from "../ui/CampaignTabs";
import CampaignActivity from "../ui/CampaignActivity";
import CampaignInfo from "../ui/CampaignProposal";
import CampaignDescription from "../ui/CampaignDescription";
import CampaignTreasuryAnalytics from "../ui/CampaignTreasuryAnalytics";
import { CampaignDetailsProps, TokenDetailsProps } from "@/app/types";

import { getTokenDetails } from "@/app/utils/poc_utils/getTokenDetails";
import { ObjectId } from "mongodb";
import { Progress } from "antd";
import type { ProgressProps } from "antd";
import CustomButton from "../ui/CustomButton";
const CampaignDetails: React.FC<CampaignDetailsProps> = async ({
  _id,
  deadline,
  description,
  token_address,
  wallet_address,
  location,
  logo,
  fund_amount,
  social_links,
  one_liner,
  status,
  title,
  user_id,
}) => {
  const tokenDetails = await getTokenDetails(token_address);
  console.log("Activity", tokenDetails!.transactions);
  const mappedTransactions = tokenDetails!.transactions.map((item: any) => ({
    address: item.address,
    type: item.type,
    amount: item.amount,
    timestamp: item.timestamp,
  }));
  const mappedHolders = tokenDetails!.holders.map((item: any) => ({
    address: item.address,
    balance: item.balance,
  }));

  const modifiedProps: TokenDetailsProps = {
    name: tokenDetails!.name,
    supply: tokenDetails!.supply,
    available_supply: tokenDetails!.available_supply,
    price: tokenDetails!.price,
    holders: mappedHolders,
    transactions: mappedTransactions,
    _id: tokenDetails!._id.toString(),
  };
  const tabItems = [
    {
      key: "1",
      label: "Activity",
      children: <CampaignActivity {...modifiedProps} />,
    },

    {
      key: "2",
      label: "Description",
      children: <CampaignDescription description={description} />,
    },
    {
      key: "3",
      label: "Treasury Analytics",
      children: <CampaignTreasuryAnalytics {...modifiedProps} />,
    },
    {
      key: "4",
      label: "Proposals",
      children: <CampaignInfo />,
    },
  ];
  const remainingFundAmount = (
    (((fund_amount - modifiedProps.available_supply) * modifiedProps.price) /
      fund_amount) *
    100
  ).toFixed(0);

  const twoColors: ProgressProps["strokeColor"] = {
    "0%": "#108ee9",
    "100%": "#87d068",
  };
  return (
    <div>
      <div className="relative w-full h-[400px]">
        <div className="absolute inset-0 w-full h-full ">
          <div className="absolute inset-0 bg-yellowColor/30 rounded-md" />
        </div>

        <div className="relative grid grid-cols-3 gap-4 h-full">
          <div className="col-span-1" />

          <div className="col-span-1 flex flex-col items-center justify-end ">
            <HexagonImage
              src="/hexbox_black_logo.svg"
              alt="demo"
              className="my-4 "
            />
          </div>

          <div className="col-span-1 flex justify-end pt-4 pr-8"></div>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl capitalize ">{title}</h1>
        <p className="mt-2 text-lg lg:text-xl ">{one_liner}</p>
      </div>
      <div className="flex justify-between mt-2">
        <div className="flex items-center">
          <h2 className="text-xl lg:text-2xl">Desired Fund Amount</h2>
          <p className="ml-4 flex items-center ">${fund_amount}</p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-4">
            {social_links && social_links.discord && (
              <FaDiscord className="w-8 h-8 lg:w-10 lg:h-10  bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
            )}
            {social_links && social_links.telegram && (
              <FaTelegramPlane className="w-8 h-8 lg:w-10 lg:h-10  bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
            )}
            {social_links && social_links.linkedIn && (
              <FaLinkedin className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-plus-lighter backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
            )}
          </div>
          <div className="flex items-center gap-2 text-white ">
            <span className="text-lg lg:text-xl">Location</span>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-">
        <div className="flex-1">
          <Progress percent={+remainingFundAmount} strokeColor={twoColors} />
        </div>
        <div className="flex-1 ">
          <CustomButton className="bg-none border-[1px] border-blueColor">
            Create a Campaign
          </CustomButton>
        </div>
      </div>

      <CampaignTabs items={tabItems} />
    </div>
  );
};

export default CampaignDetails;
