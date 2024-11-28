import React from "react";
import { TruncatedAddress } from "./TruncatedAddress";

interface AddressSectionProps {
  token_address?: string | null;
  wallet_address?: string | null;
  available_supply: number;
  supply: number;
  total_funds: number;
}

export const AddressSection: React.FC<AddressSectionProps> = ({
  token_address,
  wallet_address,
  available_supply,
  supply,
  total_funds,
}) => {
  return (
    <div className="md:flex flex-1 items-center justify-between  gap-4 w-full">
      <div className="rounded-lg bg-lightBlueColor p-4  my-4 md:my-0 h-[150px]">
        <TruncatedAddress
          address={token_address}
          label="Token Address"
          className="text-sm text-slate-800"
        />
        <br />
        <span className="mt-2 text-lg flex">
          <span className="font-bold"> Available Tokens: </span>
          <span>
            {available_supply.toLocaleString()}/{supply.toLocaleString()}
          </span>
        </span>
      </div>
      <div className="rounded-lg p-4 bg-lightBlueColor h-[150px]">
        <TruncatedAddress
          address={wallet_address}
          label="Wallet Address"
          className="text-sm text-slate-800"
        />
        <br />
        <span className="mt-2 text-lg ">
          <span className="font-bold"> Total Treasury Funds: </span>
          <span>${total_funds.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
};
