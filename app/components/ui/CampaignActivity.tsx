"use client";
import { TokenDetailsProps } from "@/app/types";
import { getWalletTokenAddress } from "@/app/utils/poc_utils/getWalletTokenAddress";
import { Table } from "antd";
import { ObjectId } from "mongodb";
import React from "react";

export default function CampaignActivity({
  name,
  supply,
  available_supply,
  holders,
  price,
  transactions,
}: TokenDetailsProps) {
  console.log(name);
  console.log(
    "---------------",
    transactions.map((item) => item)
  );
  const columns = [
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },

    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => amount.toFixed(2),
    },
    {
      title: "Created At",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
  ];
  return (
    <div>
      <h2 className="text-xl lg:text-2xl mt-4 mb-2 text-center">
        Latest Transactions
      </h2>
      <Table
        dataSource={transactions}
        columns={columns}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "bg-white" : "bg-lightBlueColor"
        }
      />
    </div>
  );
}
