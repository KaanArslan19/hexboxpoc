"use client";

import { Table, Tooltip } from "antd";
import React from "react";

export default function CampaignActivity({
  fundraiser_address,
  transactions,
}: {
  fundraiser_address: string;
  transactions: any[];
}) {
  console.log(transactions);
  if (!transactions || transactions.length === 0) {
    console.log("No transactions found");
    return <div>No transactions found</div>;
  }

  const columns = [
    {
      title: "Hash",
      dataIndex: "transactionHash",
      key: "transactionHash",
      render: (transactionHash: string) => (
        <Tooltip title={transactionHash}>
          <a href={`https://testnet.snowtrace.io/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">
            <span className="truncateAddress">
              {`${transactionHash.substring(0, 6)}...${transactionHash.substring(transactionHash.length - 4)}`}
            </span>
          </a>
        </Tooltip>
      ),
    },
    {
      title: "From",
      dataIndex: "from",
      key: "from",
      render: (from: string) => {
        if (from === fundraiser_address) {
          return (
            <Tooltip title={from}>
              <a href={`https://testnet.snowtrace.io/address/${from}`} target="_blank" rel="noopener noreferrer">
              <span className="truncateAddress">
                {`Campaign`}
              </span>
            </a>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={from}>
            <a href={`https://testnet.snowtrace.io/address/${from}`} target="_blank" rel="noopener noreferrer">
              <span className="truncateAddress">
                {`${from.substring(0, 6)}...${from.substring(from.length - 4)}`}
              </span>
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: "To",
      dataIndex: "to",
      key: "to",
      render: (to: string) => {
        if (to === fundraiser_address) {
          return (
            <Tooltip title={to}>
              <a href={`https://testnet.snowtrace.io/address/${to}`} target="_blank" rel="noopener noreferrer">
                <span>Campaign</span>
              </a>
            </Tooltip>
          );
        }
        return (
        <Tooltip title={to}>
          <a href={`https://testnet.snowtrace.io/address/${to}`} target="_blank" rel="noopener noreferrer">
            <span className="truncateAddress">
              {`${to.substring(0, 6)}...${to.substring(to.length - 4)}`}
            </span>
          </a>
        </Tooltip>
        );
      },
    },
    {
      title: "Product ID",
      dataIndex: "decodedFunction",
      key: "productId",
      render: (decodedFunction: any) => {
        if (decodedFunction?.args && decodedFunction.args.length > 0) {
          // Format the amount - this might need adjustment based on your actual data
          const productId = decodedFunction.args[0];
          // If the amount is very large, you might want to format it
          // This assumes the amount is in wei or a similar small denomination
          return Number(productId)
        }
        return "N/A";
      },
    },
    {
      title: "Amount of products",
      dataIndex: "decodedFunction",
      key: "amount",
      render: (decodedFunction: any) => {
        if (decodedFunction?.args && decodedFunction.args.length > 0) {
          // Format the amount - this might need adjustment based on your actual data
          const amount = decodedFunction.args[1];
          // If the amount is very large, you might want to format it
          // This assumes the amount is in wei or a similar small denomination
          return Number(amount).toLocaleString();
        }
        return "N/A";
      },
    },
    {
      title: "Function",
      dataIndex: "decodedFunction",
      key: "function",
      render: (decodedFunction: any) => decodedFunction?.name || "Unknown",
    },
    {
      title: "Timestamp (dd/mm/yyyy hh:mm:ss)",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: any) => {
        if (timestamp) {
          return new Date(timestamp).toLocaleString();
        }
        return "Unknown";
      },
    },
  ];

  // Add a key to each transaction for the table
  const dataSource = transactions.map((tx, index) => ({
    ...tx,
    key: tx.transactionHash || index,
  }));

  return (
    <div>
      <h2 className="text-xl md:text-2xl mt-4 mb-2 text-center">
        Latest Transactions
      </h2>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "bg-white" : "bg-lightBlueColor"
        }
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
