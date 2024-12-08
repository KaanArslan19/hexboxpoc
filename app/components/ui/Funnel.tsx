import React from "react";
import CustomButton from "./CustomButton";
import Link from "next/link";
interface Props {
  firstButtonLink: string;
  firstButtonText: string;
  secondButtonLink: string;
  secondButtonText: string;
}
export default function Funnel(funnelProps: Props) {
  return (
    <div className="my-8 w-full flex justify-center gap-8 md:gap-4">
      <Link href={funnelProps.firstButtonLink}>
        <CustomButton className="py-4 hover:bg-lightBlueColor">
          {funnelProps.firstButtonText}
        </CustomButton>
      </Link>
      <Link href={funnelProps.secondButtonLink}>
        <CustomButton className="bg-blueColor text-white hover:bg-blueColor/90 py-4">
          {funnelProps.secondButtonText}{" "}
        </CustomButton>
      </Link>
    </div>
  );
}
