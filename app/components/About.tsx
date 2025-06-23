"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { AboutData } from "../types";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Funnel from "./ui/Funnel";

export default function About() {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const router = useRouter();
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    if (isHovered) {
      setProgress(0);
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        currentProgress += 1;
        if (currentProgress <= 100) {
          setProgress(currentProgress);
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }, 20);
    } else {
      setProgress(0);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isHovered]);
  const handleButtonClick = () => {
    router.push("/waitlist");
  };
  const ABOUT_DATA: AboutData[] = [
    {
      image: "/images/about/join_waitlist.png",
      header: "On-Chain Refundable Investment",
      description:
        "Join campaigns where your funds are secured in escrow smart contracts. If funding goals aren’t met, your investment is refunded.",
    },
    {
      image: "/images/about/collaborate.png",
      header: "NFT Ticket Mechanism",
      description:
        "Every investment is tied to an NFT ticket that proves your stake and unlocks campaign utility. Track, trade, or redeem your ticket for access to products, services, or updates — all on-chain.",
    },
    {
      image: "/images/about/launch.png",
      header: "Invest with Confidence",
      description:
        "With Hexbox, capital flows through smart contracts built for transparency. You choose campaigns with flexible or milestone-based models, monitor fund usage, and make informed moves with real-time insights.",
    },
  ];
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-5xl capitalize text-center mb-4 font-customFont_bold text-blueColorDull">
        Invest in Real-World Innovation, <br className="hidden sm:inline " />
        On-Chain
      </h1>
      <p className="mb-8 text-lg lg:text-xl text-center text-textPrimary">
        Back real products and services with milestone-based smart contracts,
        refundable investments, and NFT-proven access
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
        {ABOUT_DATA.map((item, index) => (
          <li
            key={index}
            className="w-full max-w-sm h-[28rem] flex flex-col bg-gradient-to-bl from-yellowColor/40 via-orangeColor/50 to-blueColor/20 rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="h-32 flex items-center justify-center p-4">
              <Image
                className="h-32 w-32 rounded-full object-contain"
                src={item.image}
                alt={item.header}
                width={128}
                height={128}
              />
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <h4 className="text-2xl font-customFont_regular text-center mb-4 text-orangeColor h-[60px]">
                {item.header}
              </h4>
              <div className="flex-1 overflow-y-auto">
                <p className="text-base lg:text-lg text-textPrimary ">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Funnel
        firstButtonLink="campaigns"
        firstButtonText="Explore campaigns"
        secondButtonLink="https://hexbox.gitbook.io/hexbox/faq/investor-buyer-questions"
        secondButtonText="Read the Docs"
        secondButtonOpenInNewTab={true}
      />
    </div>
  );
}
