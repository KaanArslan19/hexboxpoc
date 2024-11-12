"use client";
import React, { useEffect, useState } from "react";
import HexagonImage from "../ui/HexagonImage";
import Image from "next/image";
import { FaDiscord, FaLinkedin } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
import CampaignTabs from "../ui/CampaignTabs";
import CampaignActivity from "../ui/CampaignActivity";
import CampaignInfo from "../ui/CampaignInfo";
import CampaignDescription from "../ui/CampaignDescription";
import CampaignTreasuryAnalytics from "../ui/CampaignTreasuryAnalytics";

export default function CampaignDetails() {
  const tabItems = [
    {
      key: "1",
      label: "Activity",
      children: <CampaignActivity />,
    },
    {
      key: "2",
      label: "Info",
      children: <CampaignInfo />,
    },
    {
      key: "3",
      label: "Description",
      children: <CampaignDescription />,
    },
    {
      key: "4",
      label: "Treasury Analytics",
      children: <CampaignTreasuryAnalytics />,
    },
  ];
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onResize = () => setMobile(window.innerWidth < 960);
      window!.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);
  return (
    <div>
      <div className="relative w-full h-[400px]">
        <div className="absolute inset-0 w-full h-full ">
          <Image
            src="/hexbox_name_logo_black.png"
            alt="background-cover"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-lightBlueColor/10 rounded-md" />
        </div>

        <div className="relative grid grid-cols-3 gap-4 h-full">
          <div className="col-span-1" />

          <div className="col-span-1 flex flex-col items-center justify-end ">
            <HexagonImage
              src="/hexbox_name_logo_black.png"
              alt="demo"
              size={!mobile ? 300 : 200}
              className="my-4 "
            />
          </div>

          <div className="col-span-1 flex justify-end pt-4 pr-8">
            <div className="flex flex-col items-end gap-4">
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

              <div className="flex gap-4">
                <FaDiscord className="w-8 h-8 lg:w-10 lg:h-10  bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
                <FaTelegramPlane className="w-8 h-8 lg:w-10 lg:h-10  bg-blueColor/30 text-white mix-blend-difference backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
                <FaLinkedin className="w-8 h-8 lg:w-10 lg:h-10 bg-blueColor/30 text-white mix-blend-plus-lighter backdrop-blur rounded-full p-2 hover:bg-lightBlueColor/30 transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <h1 className="mt-4 text-2xl lg:text-3xl ">Title</h1>
        <span className="mt-2 text-lg lg:text-xl ">OneLiner</span>
      </div>

      <CampaignTabs items={tabItems} />
    </div>
  );
}
