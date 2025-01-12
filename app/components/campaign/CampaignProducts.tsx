"use client";

import { Product } from "@/app/types";
import { Table, Tooltip } from "antd";
import Image from "next/image";
import React from "react";

interface CampaignProductsProps {
  products: Product[];
}

export default function CampaignProducts({ products }: CampaignProductsProps) {
  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image: string) => (
        <div className="relative w-16 h-16">
          <Image
            src={`${process.env.R2_BUCKET_URL}/campaign_logos/` + image}
            alt="Product"
            fill
            className="object-contain rounded-md"
          />
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Tooltip title={name}>
          <span className="font-medium truncate max-w-[200px] block">
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      render: (details: string) => (
        <Tooltip title={details}>
          <span className="truncate max-w-[300px] block text-gray-600">
            {details}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="font-medium">
          $
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: "Supply",
      dataIndex: "supply",
      key: "supply",
      render: (supply: number) => (
        <span className="font-medium">{supply.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl lg:text-2xl mt-4 mb-2 text-center">
        Product Inventory
      </h2>
      <Table dataSource={products} columns={columns} className="w-full" />
    </div>
  );
}
