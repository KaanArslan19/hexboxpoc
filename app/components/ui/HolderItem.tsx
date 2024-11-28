"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface HolderCopyProps {
  address: string;
  colorScale: (index: number) => string;
  balance: number;
  percentage: number;
  index: number;
}

export const HolderItem: React.FC<HolderCopyProps> = ({
  address,
  colorScale,
  balance,
  percentage,
  index,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 transition-colors relative group">
      <div
        className="w-4 h-4 rounded-full"
        style={{
          backgroundColor: colorScale(index) as string,
        }}
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={copyAddress}>
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-gray-900 truncate">
            {address}
          </div>
          {copied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy
              size={16}
              className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
        <div className="text-xs text-gray-500">{balance.toLocaleString()}</div>
      </div>
      <div className="text-sm font-semibold text-gray-700">
        {percentage.toFixed(2)}%
      </div>

      {copied && (
        <div className="absolute top-full left-0 mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded shadow-md z-10 animate-bounce">
          Address Copied!
        </div>
      )}
    </div>
  );
};
