import { ObjectId } from "mongodb";
import React from "react";

export interface MenuItems {
  href: string;
  icon: React.JSX.Element;
  label: string;
}

export interface MenuItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
}

export interface CampaignListProps {
  listings: {
    _id: string;
    user_id: string;
    title: string;
    description: string;
    fund_amount: number;
    logo: string;
    one_liner: string;
    location: string;
    deadline: number;
    social_links: SocialLinks;
    background_image: string;
    hexbox_address: string;
    status: Status;
  }[];
}
export interface CampaignDetailsProps {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  fund_amount: number;
  logo: string;
  one_liner: string;
  location: string;
  deadline: number;
  social_links: SocialLinks;
  background_image: string;
  token_address: string;
  wallet_address: string;
  status: Status;
  products: Product[];
}
enum Status {
  Active = "active",
  Inactive = "Inactive",
  Completed = "Completed",
}
export enum FundingType {
  Limitless = "Limitless",
  AllOrNothing = "AllOrNothing",
  Flexible = "Flexible",
}
export enum ProductOrService {
  ProductOnly = "Only Product",
  ServiceOnly = "Only Service",
  ProductAndService = "Product and Service",
}

export interface CampaignItemProps {
  id: string;
  userId: string;
  one_liner: string;
  title: string;
  fundAmount: number;
  logo: string;
  status?: Status;
}
interface SocialLinks {
  discord?: string;
  telegram?: string;
  website?: string;
  linkedIn?: string;
}
export interface NewCampaignInfo {
  title: string;
  description: string;
  one_liner: string;
  location: string;
  deadline: number;
  social_links: SocialLinks;
  fundAmount: number;
  logo: File;
  walletAddress: string;
  funding_type: FundingType;
  product_or_service: ProductOrService;
}

export interface FetchCampaignsProps {
  _id: string;
  title: string;
  user_id: string;
  description: string;
  one_liner: string;
  location: string;
  deadline: number;
  is_verified: boolean;
  social_links: SocialLinks;
  fundAmount: number;
  logo: File;
  wallet_address: string;
  token_address: string;
  funding_type: FundingType;
  evm_wa: string;
  product_or_service: ProductOrService;
}
export interface AboutData {
  image: string;
  header: string;
  description: string;
}
export interface TokenDetailsProps {
  _id: string;
  name: string;
  supply: number;
  available_supply: number;
  price: number;
  holders: [{ address: string; balance: number }];
  transactions: [
    {
      address: string;
      type: string;
      amount: number;
      timestamp: Date;
    }
  ];
}

export type WalletDetails = {
  total_funds: number;
  token_address: string;
};

export interface Product {
  id: string;
  campaignId: string;
  userId: string;
  image: string;
  name: string;
  description: string;
  price: number;
  status: string;
  supply: number;
}

export interface NewProductInfo {
  image: string;
  name: string;
  description: string;
  price: number;
  supply: number;
}
