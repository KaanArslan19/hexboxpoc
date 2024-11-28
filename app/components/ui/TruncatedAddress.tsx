"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface TruncatedAddressProps {
  address?: string | null;
  label?: string;
  className?: string;
  fullLength?: boolean;
}

export const TruncatedAddress: React.FC<TruncatedAddressProps> = ({
  address,
  label,
  className = "",
  fullLength = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const truncatedAddress = address
    ? fullLength
      ? address
      : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "N/A";

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {label && <span className="font-semibold">{label}:</span>}
      <span className="text-gray-600">{truncatedAddress}</span>
      <button onClick={copyToClipboard} aria-label="Copy address">
        {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
      </button>
    </div>
  );
};
