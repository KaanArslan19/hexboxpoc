"use client";

import React from "react";
import { Tabs } from "antd";
import { Typography } from "antd";
import { Avatar } from "antd";
import { Card } from "antd";
import { Statistic } from "antd";
import { Row } from "antd";
import { Col } from "antd";
import { Button } from "antd";
import {
  UserOutlined,
  RocketOutlined,
  ShopOutlined,
  WalletOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import CampaignsProfile from "./CampaignsProfile";
import ProductsProfile from "./ProductsProfile";
import { CampaignDetailsProps, ProductFetch } from "@/app/types";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface DashboardStats {
  totalFundsRaised: number;
  activeBackers: number;
  successfulCampaigns: number;
  productsSold: number;
  walletBalance: number;
}

interface ProfilePageClientProps {
  userId: string;
  campaigns: CampaignDetailsProps[];
  products: ProductFetch[];
  dashboardStats: DashboardStats;
}

export default function ProfilePageClient({
  userId,
  campaigns,
  products,
  dashboardStats,
}: ProfilePageClientProps) {
  const formattedTotalFunds = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dashboardStats.totalFundsRaised);
  const stats = [
    {
      title: "Total Raised",
      value: formattedTotalFunds,
    },
    {
      title: "Active Backers",
      value: dashboardStats.activeBackers,
      prefix: <TeamOutlined />,
    },
    {
      title: "Campaigns",
      value: campaigns.length,
      prefix: <RocketOutlined />,
    },
    {
      title: "Products",
      value: products.length,
      prefix: <ShopOutlined />,
    },
    {
      title: "Products Sold",
      value: dashboardStats.productsSold,
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8 overflow-hidden">
        <div className="relative">
          <div className="h-40 bg-gradient-to-r from-blueColorDull/90 to-orangeColorDull/30"></div>

          <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12 relative z-10">
            <Avatar
              size={96}
              icon={<UserOutlined />}
              className="border-4 border-white bg-blueColorDull"
            />
            <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
              <Title level={3} className="m-0">
                {userId}
              </Title>
              <Text type="secondary">
                Member since {new Date().getFullYear()}
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={16} className="mt-4 p-4" justify="space-between">
          {stats.map((stat, index) => (
            <Col
              key={index}
              flex="1 1 0%"
              style={{ minWidth: 150 }}
              className="mb-4"
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                className="text-center"
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="campaigns"
        type="card"
        size="large"
        className="bg-white rounded-lg shadow-sm p-4"
      >
        <TabPane
          tab={
            <span>
              <RocketOutlined />
              Campaigns ({campaigns.length})
            </span>
          }
          key="campaigns"
        >
          <CampaignsProfile campaigns={campaigns} userId={userId} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ShopOutlined />
              Products ({products.length})
            </span>
          }
          key="products"
        >
          <ProductsProfile products={products} userId={userId} />
        </TabPane>

        {/*         <TabPane
          tab={
            <span>
              <WalletOutlined />
              Wallet
            </span>
          }
          key="wallet"
        >
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <Title level={4}>Crypto Wallet</Title>
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
              <Statistic
                title="Current Balance"
                value={dashboardStats.walletBalance}
                precision={4}
                suffix="ETH"
                className="mb-6"
              />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button type="primary" size="large" block>
                  Deposit
                </Button>
                <Button size="large" block>
                  Withdraw
                </Button>
              </div>
              <div className="mt-8 pt-4 border-t text-left">
                <Text type="secondary">Recent Transactions</Text>
                <p className="text-center text-gray-400 my-6">
                  No recent transactions
                </p>
              </div>
            </div>
          </div>
        </TabPane> */}
      </Tabs>
    </div>
  );
}
