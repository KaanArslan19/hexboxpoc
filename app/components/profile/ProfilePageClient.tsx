"use client";

import React from "react";
import { Tabs } from "antd";
import { Typography } from "antd";
import { Avatar } from "antd";
import { Card } from "antd";
import { Statistic } from "antd";
import { Row } from "antd";
import { Col } from "antd";
import {
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import logo from "../../../public/hexbox_black_logo.svg";

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
  const contactDetails =
    campaigns.length > 0
      ? {
          phoneNumber: campaigns[0].phoneNumber || "Not provided",
          email: campaigns[0].email || "Not provided",
        }
      : {
          phoneNumber: "Not provided",
          email: "Not provided",
        };

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
  console.log(campaigns, "campaigns");
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8 overflow-hidden rounded-xl ">
        <div className="relative">
          <div className="h-40 relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blueColor via-blueColorDull to-blueColor" />

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(233,78,27,0.7)_0%,transparent_80%)]" />
            <div className="absolute inset-0 backdrop-blur-[100px]" />

            <div className="absolute inset-0 opacity-30">
              <div className="hexagon-pattern animate-pulse" />
            </div>

            <div className="absolute inset-0">
              <div className="particles-container">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="particle absolute animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 8 + 8}s`,
                      animationDelay: `${Math.random() * 5}s`,
                    }}
                  >
                    <svg
                      width={Math.random() * 16 + 8}
                      height={Math.random() * 16 + 8}
                      viewBox="0 0 24 24"
                      fill="rgba(255, 255, 255, 0.2)"
                    >
                      <path d="M12,0 L23.1,6 L23.1,18 L12,24 L0.9,18 L0.9,6 Z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-4 top-4">
              <div className="chain-icon animate-pulse-slow text-black bg-white rounded-full ">
                <Image
                  src={logo}
                  alt="Blockchain"
                  width={50}
                  height={50}
                  className="w-12 h-12"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12 relative z-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blueColor to-orangeColor rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-sm transition-all duration-300"></div>
              <Avatar
                size={96}
                icon={<UserOutlined />}
                className="border-4 border-white bg-blueColorDull relative group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-grow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end">
                <div>
                  <Title level={3} className="m-0 flex items-center">
                    {userId}
                    <span className="ml-2 inline-block bg-gradient-to-r from-blueColor to-orangeColor rounded-full h-2 w-2 animate-ping"></span>
                  </Title>
                  <Text type="secondary" className="flex items-center gap-1">
                    <ClockCircleOutlined className="animate-pulse-slow" />
                    Member since {new Date().getFullYear()}
                  </Text>
                </div>

                <div className="mt-4 md:mt-0 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneOutlined className="text-blueColor" />
                    <Text strong>Phone:</Text>
                    <Text copyable>{contactDetails.phoneNumber}</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailOutlined className="text-orangeColorDull" />
                    <Text strong>Email:</Text>
                    <Text copyable>{contactDetails.email}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Row gutter={16} className="mt-4 p-4" justify="space-between">
          {stats.map((stat, index) => (
            <Col
              key={index}
              flex="1 1 0%"
              style={{
                minWidth: 150,
                animationDelay: `${index * 1}s`,
              }}
              className="mb-4 reveal-stat"
            >
              <div className="relative overflow-hidden p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-300">
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full "></div>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  className="text-center"
                  valueStyle={{
                    color: "#1890ff",
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
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
