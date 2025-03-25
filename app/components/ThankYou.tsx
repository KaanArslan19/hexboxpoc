"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import ReactConfetti from "react-confetti";

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
        const response = await fetch(
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
    router.push("/");
  };

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
      <div className="max-w-2xl w-full text-center">
        <div className="relative w-64 h-64 mx-auto mb-8">
          <Image
            src="/thank_you.png"
            alt="Thank You Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 capitalize">
          Thanks for joining our waitlist!
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          {campaign?.title ? `Thank you ${campaign.title}! ` : ""}
          One of our team members will get in touch with you soon.
        </p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orangeColor/80 to-redColor/80
           rounded-lg transform transition-all duration-300
           hover:from-orangeColor hover:to-redColor hover:scale-105 hover:shadow-lg"
        >
          <MoveLeft className="w-5 h-5" color="white" />
          <span className="text-white">Go Back</span>
        </button>
      </div>
    </div>
  );
}
