import React from "react";
import CustomButton from "./CustomButton";
import Link from "next/link";

export default function Funnel() {
  return (
    <div className="my-8 max-w-6xl flex justify-center gap-8 md:gap-4">
      <Link href="campaigns">
        <CustomButton className="py-4">Explore Campaigns</CustomButton>
      </Link>
      <Link href="campaigns">
        <CustomButton className="bg-blueColor text-white hover:bg-blueColor/80 py-4">
          Explore Campaigns
        </CustomButton>
      </Link>
    </div>
  );
}
