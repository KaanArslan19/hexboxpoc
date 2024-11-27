import HexagonImage from "../ui/HexagonImage";
import { FaDiscord, FaLinkedin } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
import CampaignTabs from "../ui/CampaignTabs";
import CampaignActivity from "../ui/CampaignActivity";
import CampaignInfo from "../ui/CampaignProposal";
import CampaignDescription from "../ui/CampaignDescription";
import CampaignTreasuryAnalytics from "../ui/CampaignTreasuryAnalytics";
import { CampaignDetailsProps, TokenDetailsProps, WalletDetails } from "@/app/types";

import { getTokenDetails } from "@/app/utils/poc_utils/getTokenDetails";
import { getProposals } from "@/app/utils/poc_utils/getProposals";
import { ObjectId } from "mongodb";
import { Progress } from "antd";
import type { ProgressProps } from "antd";
import CustomButton from "../ui/CustomButton";
import CampaignProposal from "../ui/CampaignProposal";
import { TbWorld } from "react-icons/tb";
import BuyingOption from "../ui/BuyingOption";
import { FaDollarSign } from "react-icons/fa6";
import { BiDollar } from "react-icons/bi";
import Link from "next/link";
import formatPrice from "@/app/utils/formatPrice";
import { getWallet } from "@/app/utils/poc_utils/getWallet";
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

  const walletDetails = await getWallet(wallet_address);

  const proposals = await getProposals(wallet_address);

  const modifiedProps: TokenDetailsProps & WalletDetails & {wallet_address: string} = {
    name: tokenDetails!.name,
    supply: tokenDetails!.supply,
    available_supply: tokenDetails!.available_supply,
    price: tokenDetails!.price,
    holders: mappedHolders,
    transactions: mappedTransactions,
    _id: tokenDetails!._id.toString(),
    wallet_address,
    total_funds: walletDetails!.total_funds,
    token_address: walletDetails!.token_address,
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
      children: (
        <CampaignProposal
          proposals={proposals}
          holders={mappedHolders}
          businessWallet={wallet_address}
        />
      ),
    },
  ];
  const raisedFunds = fund_amount - modifiedProps.available_supply * modifiedProps.price;

  const remainingFundAmountPercentage = (
    ((raisedFunds) / fund_amount) *
    100
  ).toFixed(0);

  const twoColors: ProgressProps["strokeColor"] = {
    "0%": "#FFC629",
    "100%": "#CE0E2D",
  };
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative w-full h-[400px]">
        <div className="absolute inset-0 w-full h-full ">
          <div className="absolute inset-0 bg-yellowColor/30 rounded-md" />
        </div>

        <div className="relative grid grid-cols-3 gap-4 h-full">
          <div className="col-span-1" />

          <div className="col-span-1 flex flex-col items-center justify-end ">
            <HexagonImage
              src={`${process.env.R2_BUCKET_URL}/campaign_logos/` + logo}
              alt="demo"
              className="my-4 "
            />
          </div>

          <div className="col-span-1 flex justify-end pt-4 pr-8"></div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-4">
        <div className="flex items-center justify-center gap-4 bg-BlueColor p-4 rounded-lg  ">
          <h2 className="text-xl lg:text-2xl font-semibold ">
            Desired Fund Amount
          </h2>
          <div className="flex items-center bg-blueColor px-3 py-1 rounded-md">
            <p className="text-xl font-medium text-white ">
              {formatPrice(fund_amount)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-4">
            {social_links?.website && (
              <Link href={social_links.website}>
                <TbWorld className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
              </Link>
            )}
            {social_links?.discord && (
              <Link href={social_links.discord}>
                <FaDiscord className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
              </Link>
            )}
            {social_links?.telegram && (
              <Link href={social_links.telegram}>
                <FaTelegramPlane className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
              </Link>
            )}
            {social_links?.linkedIn && (
              <Link href={social_links.linkedIn}>
                <FaLinkedin className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-plus-lighter backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 text-white">
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

      <div className="w-full md:w-[400px] mb-8">
        <div className="flex items-center gap-2">
          <Progress
            percent={+remainingFundAmountPercentage}
            strokeColor={twoColors}
            className="w-full"
          />
          <p className="text-sm">
            (${raisedFunds})
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CampaignTabs items={tabItems} />
        </div>
        <div className="lg:col-span-1 flex justify-center">
          <BuyingOption
            pricePerToken={tokenDetails!.price}
            user={user_id}
            token_address={token_address}
          />
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
