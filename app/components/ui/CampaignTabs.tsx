"use client";
import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";

interface CampaignTabProps {
  items: TabsProps["items"];
  onChange?: (key: string) => void;
  defaultActiveKey?: string;
}

const CampaignTabs: React.FC<CampaignTabProps> = ({
  items,
  onChange,
  defaultActiveKey = "1",
}) => {
  return (
    <Tabs
      defaultActiveKey={defaultActiveKey}
      items={items}
      onChange={onChange}
      style={{ font: "#E94E1B", color: "#E94E1B" }}
    />
  );
};

export default CampaignTabs;
