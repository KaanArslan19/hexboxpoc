"use client";
import { useState } from "react";

enum FundingType {
  Limitless = "Limitless",
  AllOrNothing = "AllOrNothing",
  Flexible = "Flexible",
}

const fundingTypeDescriptions = {
  [FundingType.Limitless]: {
    title: "Limitless Funding",
    description:
      "No funding cap. Continue receiving funds until the deadline, regardless of the target amount.",
    example:
      "A community-driven open-source software project that needs ongoing contributions to maintain and improve its development.",
  },
  [FundingType.AllOrNothing]: {
    title: "All or Nothing",
    description:
      "You'll only receive the funds if the target amount is reached by the deadline. If not met, all funds are returned to backers.",
    example:
      "A new smartwatch startup raising $50,000 to cover production costs—if they don’t reach their goal, the project won’t proceed.",
  },
  [FundingType.Flexible]: {
    title: "Flexible Funding",
    description:
      "Keep all funds raised, even if you don't reach your target amount by the deadline.",
    example:
      "A local bakery looking to expand, where any funds raised will go toward renovations, even if the full target isn’t reached.",
  },
};
interface FundingTypeSelectorProps {
  setFieldValue?: (field: string, value: any) => void;
  value: FundingType;
}
export default function FundingTypeSelector({
  setFieldValue,
  value,
}: FundingTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<FundingType>(value);
  const handleSelection = (fundingKey: FundingType) => {
    setSelectedType(fundingKey);
    if (setFieldValue) {
      setFieldValue("funding_type", fundingKey);
    }
  };
  return (
    <div className="gap-6 p-4 md:grid ">
      {Object.entries(fundingTypeDescriptions).map(
        ([key, { title, description, example }]) => {
          const fundingKey = key as FundingType;
          return (
            <div
              key={key}
              className={` rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 
              hover:shadow-xl hover:border-blueColor/60 border-4 mb-2 
              ${
                selectedType === fundingKey
                  ? "border-blueColor/60 bg-lightBlueColor  dark:border-dark-text   "
                  : "border-gray-200 dark:border-dark-border"
              } 
              bg-gradient-to-br from-yellowColor/80 via-orangeColor/80 to-blueColor/40 dark:bg-gradient-to-br dark:from-redColor/60 dark:via-lightBlueColor dark:to-dark-textMuted/80 min-h-[250px] flex flex-col justify-between`}
              onClick={() => handleSelection(fundingKey)}
            >
              <div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                  {title}
                </h3>
                <p className="text-base lg:text-lg text-black/80 ">
                  {description}
                </p>
              </div>
              <div className="mt-4 p-3 bg-white rounded-md shadow-sm text-sm lg:text-base text-black/80 ">
                <span className="font-semibold">Example: </span>
                {example}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
