import React from "react";
import formatPrice from "../utils/formatPrice";

export default function AnalyticsBanner() {
  return (
    <div className=" m-auto md:flex w-full  flex-wrap justify-between gap-8 py-10 px-8 md:gap-4 md:h-[180px] max-w-5xl">
      <div className="my-0 mx-auto flex flex-col gap-4 text-center">
        <span className="text-4xl md:text-6xl text-orangeColor/90  md:text-blueColor/90 hover:text-orangeColor font-customFont_medium">
          1000
        </span>
        <span className="text-xl mb-12 capitalize font-customFont_light">
          Business born
        </span>
      </div>
      <div className="my-0 mx-auto flex flex-col gap-4 text-center">
        <span className="text-4xl md:text-6xl text-orangeColor/90 md:text-blueColor/90 hover:text-orangeColor font-customFont_medium">
          {formatPrice(1500)}
        </span>
        <span className="text-xl mb-12 capitalize font-customFont_light">
          Total Raised
        </span>
      </div>
      <div className="my-0 mx-auto flex flex-col gap-4 text-center">
        <span className="text-4xl md:text-6xl text-orangeColor/90 md:text-blueColor/90 hover:text-orangeColor font-customFont_medium">
          10500
        </span>
        <span className="text-xl  capitalize font-customFont_light">
          Secure Transactions
        </span>
      </div>
    </div>
  );
}
