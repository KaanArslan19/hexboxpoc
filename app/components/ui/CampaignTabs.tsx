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
    <div className="dark:bg-[#0D1B2A] dark:text-[#E6F1FA] rounded-xl p-2">
      <Tabs
        defaultActiveKey={defaultActiveKey}
        items={items}
        onChange={onChange}
        className="
          [&_.ant-tabs-tab]:text-gray-700 
          dark:[&_.ant-tabs-tab]:text-[#94A8BC] 
          dark:[&_.ant-tabs-tab-active]:text-[#E6F1FA] 
          dark:[&_.ant-tabs-ink-bar]:bg-[#E94E1B]
        "
      />
    </div>
  );
};

export default CampaignTabs;
