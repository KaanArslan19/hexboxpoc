"use client";
import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import { Input } from "@material-tailwind/react";
import { buyCampaignToken } from "@/app/utils/apiHelpers";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface BuyingOptionProps {
  pricePerToken: number;
  token_address: string;
  user: string;
}

const BuyingOption: React.FC<BuyingOptionProps> = ({
  pricePerToken,
  token_address,
}) => {
  const [tokenAmount, setTokenAmount] = useState<number | "">(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [triggerBuy, setTriggerBuy] = useState<boolean>(false);
  const router = useRouter();
  const session = useSession();

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
        const investorAddress = session.data?.user?.name;

        const result = await buyCampaignToken(
          investorAddress!,
          token_address,
          tokenAmount as number
        );
        if (result.error) {
          throw new Error(result.error);
        }
        setSuccess(`Successfully bought ${tokenAmount} tokens!`);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
        setTriggerBuy(false);
      }
    };

    if (triggerBuy && +tokenAmount > 0 && session) {
      executeBuyToken();
    }
  }, [triggerBuy, tokenAmount, token_address, router, session]);
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <div className="sticky top-4 w-5/6  lg:h-[400px] lg:w-full bg-gradient-to-bl from-yellowColor/70 via-orangeColor/70 to-redColor/70 shadow-md rounded-lg p-6">
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
          {tokenAmount !== 0 && (
            <div className="text-center">
              <p className="text-lg text-white">
                You will receive{" "}
                <strong className="text-white">
                  {typeof tokenAmount === "number"
                    ? tokenAmount.toFixed(2)
                    : "0.00"}
                </strong>{" "}
                tokens
              </p>
            </div>
          )}

          <CustomButton
            onClick={handleBuyTokens}
            disabled={loading}
            className="w-full bg-redColor/90 border-none text-white font-semibold px-6 py-2 rounded-md hover:bg-redColor/70 transition-colors"
          >
            {loading ? "Processing..." : "Invest"}
          </CustomButton>
        </div>
        {error && (
          <p className="text-white bg-redColor py-2 px-4 rounded-lg text-sm md:text-lg text-center blink">
            {error}
          </p>
        )}

        {success && (
          <p className="text-white bg-green-500 py-2 px-4 rounded-lg text-sm md:text-lg text-center blink">
            {success}
          </p>
        )}

        <div className="flex justify-between items-center ">
          <h5 className="text-lg font-medium text-white">Price Per Token</h5>
          <p className="text-lg font-bold text-white">
            ${pricePerToken.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyingOption;
