import HexagonImage from "../ui/HexagonImage";
import { FaDiscord, FaLinkedin } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
import CampaignTabs from "../ui/CampaignTabs";
import CampaignActivity from "../ui/CampaignActivity";
import CampaignDescription from "../ui/CampaignDescription";
import { CampaignDetailsProps, WalletDetails } from "@/app/types";

import { Progress } from "antd";
import type { ProgressProps } from "antd";
import { TbWorld } from "react-icons/tb";

import Link from "next/link";
import formatPrice from "@/app/utils/formatPrice";
import CampaignProducts from "./CampaignProducts";
import CustomButton from "../ui/CustomButton";
import { checkServerAuth } from "@/app/utils/CheckServerAuth";
import ProductTechDetails from "../ui/ProductTechDetails";
import { FaUserAlt } from "react-icons/fa";
import ShareButton from "../ui/ShareButton";
import CampaignComments from "../ui/CampaignComments";

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
  products,
  product_or_service,
  transactions,
  fundraiser_address,
  total_raised,
  comments,
}) => {
  console.log(logo, "logooooo");
  const { isAuthenticated, address } = await checkServerAuth();
  const campaignOwner = address === user_id;
  const modifiedProps: any & WalletDetails & { wallet_address: string } = {
    name: "test", //tokenDetails!.name,
    supply: 1000000, //tokenDetails!.supply,
    available_supply: 1000000, //tokenDetails!.available_supply,
    price: 1, //tokenDetails!.price,
    holders: [{ address: "0x123", balance: 1000000 }], //mappedHolders,
    transactions: transactions,
    fundraiser_address: fundraiser_address,
    // transactions:
    // [
    //   { address: "0x123", type: "buy", amount: 1000000, timestamp: new Date() },
    // ], //mappedTransactions,
    _id: "123", //tokenDetails!._id.toString(),
    wallet_address: "0x123", //walletDetails!.wallet_address,
    total_funds: 1000000, //walletDetails!.total_funds,
    token_address: "0x123", //walletDetails!.token_address,
  };
  const tabItems = [
    {
      key: "1",
      label: "Rewards",
      children: (
        <CampaignProducts
          campaignId={_id}
          userId={user_id}
          products={products ? products : []}
        />
      ),
    },

    {
      key: "2",
      label: "Description",
      children: <CampaignDescription description={description} />,
    },
    {
      key: "3",
      label: "Activity",
      children: <CampaignActivity {...modifiedProps} />,
    },

    {
      key: "4",
      label: "Tech Details",
      children: (
        <ProductTechDetails
          wallet_address={wallet_address ? wallet_address : user_id}
        />
      ),
    },
    {
      key: "5",
      label: "Comments",
      children: (
        <CampaignComments
          campaignId={_id}
          commentsProp={comments}
          currentUserId={user_id}
        />
      ),
    },
  ];

  const remainingFundAmountPercentage = (
    (Number(total_raised) / fund_amount) *
    100
  ).toFixed(0);

  const twoColors: ProgressProps["strokeColor"] = {
    "0%": "#FFC629",
    "100%": "#CE0E2D",
  };
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative w-full h-[400px]">
        <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blueColor via-blueColorDull to-blueColor" />

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(233,78,27,0.7)_0%,transparent_80%)]" />
          <div className="absolute inset-0 backdrop-blur-[100px]" />

          <div className="absolute inset-0 opacity-30">
            <div className="hexagon-pattern animate-pulse" />
          </div>

          <div className="absolute inset-0">
            <div className="particles-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="particle absolute animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 8 + 8}s`,
                    animationDelay: `${Math.random() * 5}s`,
                  }}
                >
                  <svg
                    width={Math.random() * 16 + 8}
                    height={Math.random() * 16 + 8}
                    viewBox="0 0 24 24"
                    fill="rgba(255, 255, 255, 0.2)"
                  >
                    <path d="M12,0 L23.1,6 L23.1,18 L12,24 L0.9,18 L0.9,6 Z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
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
        </div>
      </div>
      <div className="text-center my-4">
        <h1 className="text-2xl md:text-3xl  font-semibold text-blueColor z-10 break-words truncate max-w-full mx-8 overflow-hidden">
          {title}
        </h1>
        <p className="text-lg lg:text-xl font-semibold text-lightBlueColor/50 z-10 break-words truncate max-w-full overflow-hidden">
          {one_liner}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row w-full sm:items-start gap-4 my-4">
        <div className="flex self-start w-full sm:w-auto gap-4 p-4 rounded-lg">
          <h2 className="text-xl lg:text-2xl font-semibold">
            Desired Fund Amount
          </h2>
          <div className="flex items-center border-2 border-blueColorDull px-3 py-1 rounded-md">
            <p className="text-xl font-semibold text-blueColorDull truncate max-w-[250px]">
              {formatPrice(fund_amount)}
            </p>
          </div>
          {campaignOwner && (
            <Link href={`/campaign/update?campaignId=${_id}`}>
              <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg">
                Update Campaign
              </CustomButton>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-end sm:items-start gap-4 sm:ml-auto">
          <div className="flex gap-4 justify-end order-2 sm:order-1">
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

          <div className="flex flex-col items-end gap-4 order-1 sm:order-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg lg:text-xl truncate max-w-[400px]">
                {location}
              </span>
              <svg
                className="w-5 h-5 flex-shrink-0"
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

            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href={`/executor?userId=${user_id}`}>
                <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg flex items-center gap-2 whitespace-nowrap">
                  <span className="hidden sm:inline">
                    View Executor Profile
                  </span>
                  <span className="sm:hidden">Profile</span>
                  <FaUserAlt className="w-4 h-4" />
                </CustomButton>
              </Link>
              <ShareButton
                title={title}
                description={one_liner || ""}
                campaignId={_id}
              />
            </div>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="w-full md:w-[400px] mb-8">
          <div className="flex items-center gap-2">
            <Progress
              percent={+remainingFundAmountPercentage}
              strokeColor={twoColors}
              className="w-full"
            />
            <p className="text-sm">(${total_raised.toLocaleString()})</p>
          </div>
        </div>
      )}

      <div>
        <CampaignTabs items={tabItems} />
      </div>
    </div>
  );
};

export default CampaignDetails;
