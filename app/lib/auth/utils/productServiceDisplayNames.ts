import { FundingType, ProductOrService } from "app/types";
export const productServiceDisplayNames = {
  [ProductOrService.ProductOnly]: "Only Product",
  [ProductOrService.ServiceOnly]: "Only Service",
  [ProductOrService.ProductAndService]: "Product and Service",
};

export const fundingTypesDisplayNames = {
  [FundingType.Limitless]: "Limitless",
  [FundingType.AllOrNothing]: "All Or Nothing",
  [FundingType.Flexible]: "Flexible",
};
