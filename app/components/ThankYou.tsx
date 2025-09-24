"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MoveRight } from "lucide-react";
import ReactConfetti from "react-confetti";
import ShareButton from "@/app/components/ui/ShareButton";
import { apiFetch } from "@/app/utils/api-client";
export default function ThankYou() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [showConfetti, setShowConfetti] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const validateCampaign = async () => {
      if (!campaignId) {
        router.replace("/");
        return;
      }

      try {
        const response = await apiFetch(
          `/api/getCampaign?campaignId=${campaignId}`
        );
        const data = await response.json();

        if (!response.ok || !data) {
          router.replace("/");
          return;
        }

        setCampaign(data);
        setShowConfetti(true);

        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } catch (error) {
        console.error("Error fetching campaign:", error);
        router.replace("/");
      }
    };

    validateCampaign();
  }, [campaignId, router]);

  useEffect(() => {
    if (campaign) {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [campaign]);
  const handleGoBack = () => {
    router.push(`/campaign?campaignId=${campaignId}`);
  };

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50 dark:from-dark-bg dark:to-dark-surface">
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}

      <div className="max-w-2xl w-full bg-white dark:bg-dark-surface rounded-xl shadow-sm p-8 text-center">
        <div className="relative w-56 h-56 mx-auto mb-6">
          <Image
            src={`${process.env.R2_BUCKET_URL}/campaign_logos/${campaign.logo}`}
            alt="Campaign Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-dark-text">
              Success! Your campaign has been created.
            </h1>
            <p className="text-lg text-gray-600 dark:text-dark-text mb-4">
              We are eager to help you reach your goal of{" "}
              <span className="font-semibold">${campaign?.fund_amount}</span> in
              funding.
            </p>
            <p className="text-gray-600 dark:text-dark-textMuted">
              One of our team members will be in touch with you soon.
            </p>
          </div>

          <div className="border-t border-b border-gray-100 dark:border-dark-border py-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGoBack}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orangeColor to-redColor text-white font-medium rounded-lg transform transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <span>Explore Your Campaign</span>
                <MoveRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3">
                <p className="text-gray-600 dark:text-dark-textMuted whitespace-nowrap">
                  Share with others:
                </p>
                <ShareButton
                  title={campaign.title}
                  description={campaign.one_liner || ""}
                  campaignId={campaign._id}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-dark-textMuted">
            Your campaign ID: {campaign._id}
          </div>
        </div>
      </div>
    </div>
  );
}
