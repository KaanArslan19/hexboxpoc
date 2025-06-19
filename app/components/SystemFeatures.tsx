import Image from "next/image";
import React from "react";
import Funnel from "./ui/Funnel";
import { featuresArray } from "../utils/featuresArray.ts";

export default function SystemFeatures() {
  return (
    <div className="pt-16 px-4">
      <div className="text-center">
        <h2 className="text-3xl md:text-5xl font-customFont_bold mb-4 text-blueColorDull">
          Here for Innovators like you
        </h2>
        <p className="text-lg lg:text-xl text-textPrimary">
          Hexbox is a crowdfunding platform for organisations across the globe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-8 mx-auto max-w-6xl">
        {featuresArray.map((item, index) => (
          <div
            className={`flex flex-col items-center text-center lg:text-left relative `}
            key={index}
          >
            <div className="relative w-48 h-48 rounded-full overflow-visible mb-6">
              {item.isComingSoon && (
                <>
                  <div className="absolute -top-2 -right-6 z-20">
                    <div className="bg-gradient-to-r from-blueColor/80 to-orangeColor text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 animate-pulse border-2 border-white">
                      Coming Soon
                    </div>
                  </div>
                </>
              )}

              <div className="rounded-full overflow-hidden w-full h-full relative">
                {item.isComingSoon && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-20 rounded-full z-5"></div>
                )}
                <Image
                  src={item.image}
                  alt={item.header}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={`object-cover ${
                    item.isComingSoon ? "grayscale-[70%]" : ""
                  }`}
                />
              </div>
            </div>

            <h4 className="text-xl font-semibold mb-4 text-blackColorDull">
              {item.header}
            </h4>

            <p className="text-base lg:text-lg max-w-[200px] ">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <Funnel
        firstButtonLink="https://hexbox.gitbook.io/hexbox/"
        firstButtonText="Read the Docs"
        secondButtonLink="/campaign/create"
        secondButtonText="Create a campaign"
      />
    </div>
  );
}
