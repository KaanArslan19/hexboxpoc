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
    background_image: string;
    hexbox_address: string;
    status: boolean;
  }[];
}
enum Status {
  Active = "Active",
  Inactive = "Inactive",
  Completed = "Completed",
}

export interface CampaignItemProps {
  id: string;
  userId: string;
  title: string;
  description: string;
  fundAmount: number;
  logo: string;
  backgroundImage: string;
  hexboxAddress: string;
  status?: Status;
}
interface SocialLinks {
  discord?: string;
  telegram: string;
  website?: string;
  linkedIn?: string;
}
export interface NewCampaignInfo {
  title: string;
  description: string;
  oneLiner?: string;
  location?: string;
  deadline?: string;
  social_links?: SocialLinks;
  fundAmount: number;
  logo: File;
  // hexboxAddress: string;
  /*   backgroundImage: File;
   */
  totalSupply: number;
}

export interface AboutData {
  image: string;
  header: string;
  description: string;
}
