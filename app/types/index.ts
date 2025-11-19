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
    total_raised: number;
  }[];
  query?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}
interface Author {
  name: string;
  userId: string;
  isCreator: boolean;
  isBacker: boolean;
}
interface Comment {
  id: string;
  author: Author;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  isExpanded: boolean;
}
// Funds management history entry type
export interface FundsManagementHistoryEntry {
  text: string;
  timestamp: number; // Unix timestamp in milliseconds
}

// Funds management can be string (legacy) or array of history entries
export type FundsManagement = string | FundsManagementHistoryEntry[];

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
  funding_type: FundingType;
  product_or_service: ProductOrService;
  social_links: SocialLinks;
  background_image: string;
  token_address: string;
  wallet_address: string;
  status: Status;
  products: ProductFetch[];
  transactions: any[];
  fundraiser_address: string;
  total_raised: number;
  is_verified: boolean;
  email: string;
  phoneNumber: string;
  funds_management: FundsManagement;
  comments?: Comment[];
}
export interface CampaignBackendDetails {
  _id: ObjectId;
  user_id: string;
  title: string;
  description: string;
  fund_amount: number;
  logo: string;
  one_liner: string;
  location: string;
  deadline: number;
  funding_type: FundingType;
  product_or_service: ProductOrService;
  social_links: SocialLinks;
  background_image: string;
  token_address: string;
  wallet_address: string;
  status: Status;
  products: ProductFetch[];
  transactions: any[];
  fundraiser_address: string;
  total_raised: number;
  is_verified: boolean;
  email: string;
  phoneNumber: string;
  funds_management: FundsManagement;
  comments?: Comment[];
}
export enum Status {
  active = "active",
  verified = "verified",
  finalized = "finalized",
}
export enum FundingType {
  Limitless = "Limitless",
  AllOrNothing = "AllOrNothing",
  Flexible = "Flexible",
}
export enum ProductOrService {
  ProductOnly = "ProductOnly",
  ServiceOnly = "ServiceOnly",
  ProductAndService = "ProductAndService",
}

export interface CampaignItemProps {
  id: string;
  userId: string;
  one_liner: string;
  title: string;
  fundAmount: number;
  logo: string;
  status?: Status;
  total_raised: number;
}
interface SocialLinks {
  discord?: string;
  telegram?: string;
  website?: string;
  linkedIn?: string;
}
export interface NewCampaignInfo {
  title: string;
  email: string;
  phoneNumber: string;
  description: string;
  one_liner: string;
  location: string;
  deadline: number;
  social_links: SocialLinks;
  fundAmount: number;
  logo: File;
  wallet_address: string;
  funding_type: FundingType;
  funds_management: FundsManagement;
  turnstileToken?: string; // Optional Turnstile token for bot protection
}
export interface NewCampaignInfoResponse {
  _id: string;
  title: string;
  email: string;
  phoneNumber: string;
  description: string;
  one_liner: string;
  location: string;
  deadline: number;
  social_links: SocialLinks;
  logo: File;
  fund_amount: number;
  funding_type: FundingType;
  wallet_address: string;
  funds_management: FundsManagement;
}
export interface CampaignInfoUpdate {
  title: string;
  email: string;
  phoneNumber: string;
  description: string;
  one_liner: string;
  location: string;
  deadline?: number; // Not updatable - kept for backward compatibility
  social_links: SocialLinks;
  logo: File | string;
  fund_amount?: number; // Not updatable - kept for backward compatibility
  funding_type?: FundingType; // Not updatable - kept for backward compatibility
  wallet_address: string;
  funds_management: FundsManagement;
  turnstileToken?: string; // Optional for backward compatibility
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
export interface ProductFetch {
  id: string;
  productId: number;
  manufacturerId: string;
  name: string;
  type: ProductOrService;
  countryOfOrigin: string;
  category: { name: ProductCategory } | string;
  description: string;
  price: {
    amount: number;
    tax_inclusive: boolean;
    gst_rate: number;
    gst_amount: number;
  };
  inventory: {
    stock_level: number;
  };
  isUnlimitedStock?: boolean;
  freeShipping: boolean | string;
  productReturnPolicy: {
    eligible: boolean;
    return_period_days: number;
    conditions: string;
  } | null;
  campaignId: string;
  userId: string;
  logo: string;
  images: {
    uploadedFiles: string[];
    errors: string | null;
  };
  status: string;
  supply: number;
  sold_count: number;
  fulfillmentDetails: string;
  deliveryDate: string;
  originalProductId: number;
}
export interface NewProductInfo {
  image: string;
  name: string;
  description: string;
  price: number;
  supply: number;
}

export enum ProductCategory {
  TECH = "Tech & Innovation",
  ART = "Art & Creative",
  GAMING = "Gaming & Esports",
  DEFI = "DeFi & Finance",
  NFT = "NFT & Collectibles",
  HEALTH = "Health & Well-being",
  EDUCATION = "Education & Research",
  SOCIAL_IMPACT = "Social Impact & Charity",
  ENVIRONMENT = "Environment & Sustainability",
  WEB3 = "Web3 Infrastructure",
  AI = "Artificial Intelligence",
  DAO = "Decentralized Autonomous Organizations",
  METAVERSE = "Metaverse & Virtual Worlds",
  MUSIC = "Music & Entertainment",
  FILM = "Film & Video",
  HARDWARE = "Hardware & Gadgets",
  REAL_ESTATE = "Real Estate & Tokenized Assets",
  SPORTS = "Sports & Fitness",
  FASHION = "Fashion & Wearables",
  FOOD = "Food & Beverages",
}

export interface ProductNew {
  manufacturerId: string;
  name: string;
  type: ProductOrService;
  countryOfOrigin: string;
  category: { name: ProductCategory };
  description: string;
  price: {
    amount: number;
    tax_inclusive: boolean;
    gst_rate: number;
    gst_amount: number;
  };
  inventory: {
    stock_level: number;
  };
  freeShipping: boolean;
  productReturnPolicy: {
    eligible: boolean;
    return_period_days: number;
    conditions: string;
  };
  campaignId: string;
  userId: string;
  logo: string;
  images: File[];
  status: string;
  fulfillmentDetails: string;
  deliveryDate: string;
  isUnlimitedStock?: boolean;
}
