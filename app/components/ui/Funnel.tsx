import React from "react";
import CustomButton from "./CustomButton";
import Link from "next/link";

interface Props {
  firstButtonLink: string;
  firstButtonText: string;
  secondButtonLink: string;
  secondButtonText: string;
  firstButtonOpenInNewTab?: boolean;
  secondButtonOpenInNewTab?: boolean;
}

export default function Funnel(funnelProps: Props) {
  return (
    <div className="my-8 w-full flex flex-col md:flex-row justify-center gap-4 items-center">
      <Link
        href={funnelProps.firstButtonLink}
        className="w-full md:w-auto"
        target={funnelProps.firstButtonOpenInNewTab ? "_blank" : undefined}
        rel={
          funnelProps.firstButtonOpenInNewTab
            ? "noopener noreferrer"
            : undefined
        }
      >
        <CustomButton className="bg-blueColor text-white hover:bg-blueColor/90 py-2 md:py-4 w-full md:w-auto">
          {funnelProps.firstButtonText}
        </CustomButton>
      </Link>
      <Link
        href={funnelProps.secondButtonLink}
        className="w-full md:w-auto"
        target={funnelProps.secondButtonOpenInNewTab ? "_blank" : undefined}
        rel={
          funnelProps.secondButtonOpenInNewTab
            ? "noopener noreferrer"
            : undefined
        }
      >
        <CustomButton className="py-2 md:py-4 hover:bg-lightBlueColor w-full md:w-auto">
          {funnelProps.secondButtonText}
        </CustomButton>
      </Link>
    </div>
  );
}
