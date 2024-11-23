"use client";
import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import { Input } from "@material-tailwind/react";
import { buyCampaignToken } from "@/app/utils/apiHelpers";
import { useRouter } from "next/navigation";

interface BuyingOptionProps {
  pricePerToken: number;
  token_address: string;
  user: string;
}

const BuyingOption: React.FC<BuyingOptionProps> = ({
  pricePerToken,
  token_address,
  user,
}) => {
  const [tokenAmount, setTokenAmount] = useState<number | "">(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [triggerBuy, setTriggerBuy] = useState<boolean>(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      setUsdAmount(Number(value));
    } else {
      setUsdAmount(0);
    }
  };

  useEffect(() => {
    if (usdAmount > 0) {
      setTokenAmount(usdAmount / pricePerToken);
    } else {
      setTokenAmount(0);
    }
  }, [usdAmount, pricePerToken]);

  const handleBuyTokens = () => {
    if (tokenAmount && tokenAmount > 0) {
      setTriggerBuy(true);
    } else {
      alert("Please enter a valid amount.");
    }
  };

  useEffect(() => {
    const executeBuyToken = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const result = await buyCampaignToken(
          user,
          token_address,
          tokenAmount as number
        );
        if (result.error) {
          throw new Error(result.error);
        }
        setSuccess(`Successfully bought ${tokenAmount} tokens!`);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
        setTriggerBuy(false);
      }
    };

    if (triggerBuy && +tokenAmount > 0) {
      executeBuyToken();
    }
  }, [triggerBuy, tokenAmount, token_address, user, router]);

  return (
    <div className="sticky top-4 w-3/4  lg:h-[400px] lg:w-full bg-gradient-to-bl from-yellowColor/70 via-orangeColor/70 to-redColor/70 shadow-md rounded-lg p-6">
      <div className="space-y-6">
        <h4 className="text-lg md:text-xl font-semibold text-center text-white">
          Fund the Campaign and Become an Investor
        </h4>

        <div className="space-y-4">
          <Input
            placeholder="Enter USD amount"
            className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 placeholder:opacity-100 "
            labelProps={{
              className: "hidden",
            }}
            type="number"
            min="0"
            value={usdAmount === 0 ? "" : usdAmount}
            onChange={handleInputChange}
          />

          <div className="text-white text-center">
            <p className="text-lg">
              You will receive{" "}
              <strong>
                {typeof tokenAmount === "number"
                  ? tokenAmount.toFixed(2)
                  : "0.00"}
              </strong>{" "}
              tokens
            </p>
          </div>

          <CustomButton
            onClick={handleBuyTokens}
            disabled={loading}
            className="w-full bg-redColor/90 border-none text-white font-semibold px-6 py-2 rounded-md hover:bg-redColor/70 transition-colors"
          >
            {loading ? "Processing..." : "Invest"}
          </CustomButton>
        </div>

        {error && <p className="text-red-900 text-sm text-center">{error}</p>}

        {success && (
          <p className="text-green-500 text-sm text-center">{success}</p>
        )}

        <div className="flex justify-between items-center text-white">
          <h5 className="text-lg font-medium">Price Per Token</h5>
          <p className="text-lg font-bold">${pricePerToken.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default BuyingOption;
