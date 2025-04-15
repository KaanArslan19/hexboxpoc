import { FundingType, ProductOrService } from "@/app/types";

export const productOrServiceLabels: Record<ProductOrService, string> = {
  [ProductOrService.ProductOnly]: " Product",
  [ProductOrService.ServiceOnly]: " Service",
  [ProductOrService.ProductAndService]: " Product and Service",
};

export const fundingTypeLabels: Record<FundingType, string> = {
  [FundingType.Limitless]: "Limitless",
  [FundingType.AllOrNothing]: "All or Nothing",
  [FundingType.Flexible]: "Flexible",
};
