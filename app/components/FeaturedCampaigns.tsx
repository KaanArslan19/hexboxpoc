"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Trophy, Award, Medal, ChevronRight, ChevronLeft } from "lucide-react";
import { CampaignListProps } from "@/app/types";
import Image from "next/image";
import CustomButton from "@/app/components/ui/CustomButton";
import Link from "next/link";

export default function FeaturedCampaigns({ listings }: CampaignListProps) {
  const topCampaigns = listings.slice(0, 3);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Helpers to safely handle possibly null/undefined numeric values
  const coerceToNumber = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const coerced = Number(value);
    return Number.isFinite(coerced) ? coerced : 0;
  };

  const formatCurrency = (value: unknown): string => {
    const amount = coerceToNumber(value);
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const [autoplayInterval, setAutoplayInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Function to update the selected index when slide changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  // Store scroll snaps for the indicators
  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  const startAutoplay = useCallback(() => {
    if (!emblaApi || autoplayInterval) return;

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000);

    setAutoplayInterval(interval);
  }, [emblaApi, autoplayInterval]);

  const stopAutoplay = useCallback(() => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      setAutoplayInterval(null);
    }
  }, [autoplayInterval]);

  useEffect(() => {
    if (!emblaApi) return;

    onInit();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onInit);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onInit);
    };
  }, [emblaApi, onSelect, onInit]);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [emblaApi, startAutoplay, stopAutoplay]);

  // Carousel hover events
  const handleMouseEnter = useCallback(() => {
    stopAutoplay();
  }, [stopAutoplay]);

  const handleMouseLeave = useCallback(() => {
    startAutoplay();
  }, [startAutoplay]);

  const calculateProgress = (raised: unknown, target: unknown) => {
    const safeRaised = coerceToNumber(raised);
    const safeTarget = coerceToNumber(target);
    if (safeTarget <= 0) return 0;
    return Math.min(Math.round((safeRaised / safeTarget) * 100), 100);
  };

  const getBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 p-3 rounded-full shadow-lg transform -rotate-12 z-10">
            <Trophy size={24} className="text-white" />
          </div>
        );
      case 1:
        return (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-gray-400 to-gray-500 p-3 rounded-full shadow-lg transform -rotate-12 z-10">
            <Award size={24} className="text-white" />
          </div>
        );
      case 2:
        return (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-full shadow-lg transform -rotate-12 z-10">
            <Medal size={24} className="text-white" />
          </div>
        );
      default:
        return null;
    }
  };
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Force a rerender of the carousel when tab becomes visible again
        setIsVisible(false);
        // Small timeout to ensure DOM updates
        setTimeout(() => {
          setIsVisible(true);
          if (emblaApi) {
            emblaApi.reInit();
            onSelect();
          }
        }, 50);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [emblaApi, onSelect]);
  if (!topCampaigns.length) return null;

  return (
    <div
      className="mb-16 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-customFont_bold text-blueColorDull dark:text-dark-text">
          Top Campaigns
        </h2>
      </div>

      <div className="hidden md:block">
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white dark:bg-dark-surface p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-dark-surfaceHover transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} className="text-blueColor dark:text-white" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white dark:bg-dark-surface p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-dark-surfaceHover transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={24} className="text-blueColor dark:text-white" />
        </button>
      </div>

      <div className="relative">
        {isVisible && (
          <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
            <div className="flex">
              {topCampaigns.map((campaign, index) => (
                <div
                  key={campaign._id}
                  className="flex-[0_0_100%] min-w-0 relative p-6 md:p-10"
                >
                  <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-md overflow-hidden relative transform transition-all hover:-translate-y-1 hover:shadow-lg h-[600px] md:h-[400px] border-[1px] border-lightBlueColor dark:border-dark-border">
                    {getBadge(index)}

                    <div className="relative flex flex-col md:flex-row h-full">
                      <div className="w-full md:w-2/5 relative h-60 md:h-full">
                        <div className="absolute inset-0 z-10"></div>
                        <Image
                          className="h-full w-full object-contain object-center p-2"
                          loading="lazy"
                          src={
                            `${process.env.R2_BUCKET_URL}/campaign_logos/` +
                            campaign.logo
                          }
                          alt={campaign.title}
                          width={300}
                          height={400}
                        />
                        <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm px-3 py-1 rounded-full z-20">
                          <span className="text-blueColor dark:text-white font-bold tracking-wider">
                            #{index + 1} Top Campaign
                          </span>
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="overflow-hidden">
                          <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white truncate">
                            {campaign.title}
                          </h3>
                          <p className="text-gray-600 dark:text-dark-textMuted mb-6 line-clamp-2">
                            {campaign.one_liner}
                          </p>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-bold text-blueColor dark:text-white">
                              ${formatCurrency(campaign.total_raised)}
                            </span>
                            <span className="text-gray-500 dark:text-dark-textMuted font-medium">
                              of ${formatCurrency(campaign.fund_amount)}
                            </span>
                          </div>

                          <div className="relative w-full h-3 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                            <div
                              className="relative h-full rounded-full overflow-hidden bg-gradient-to-r from-blueColor to-orangeColor/70 via-lightBlueColor/70 dark:from-dark-textMuted/80  dark:to-redColor/60"
                              style={{
                                width: `${calculateProgress(
                                  campaign.total_raised,
                                  campaign.fund_amount
                                )}%`,
                              }}
                            >
                              <div
                                className="absolute top-0 left-0 h-full w-full bg-repeat-x"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)",
                                  backgroundSize: "10px 10px",
                                  animation:
                                    "progressAnimation 1s linear infinite",
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="mt-2 text-right">
                            <span className="text-sm font-medium text-gray-600 dark:text-dark-textMuted">
                              {calculateProgress(
                                campaign.total_raised,
                                campaign.fund_amount
                              )}
                              % Funded
                            </span>
                          </div>
                        </div>

                        <Link href={`/campaign?campaignId=${campaign._id}`}>
                          <CustomButton className="w-full custom-button-dynamic py-3 px-6 rounded-xl text-center font-medium transition-all shadow-md hover:shadow-lg">
                            View Campaign
                          </CustomButton>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6 gap-3">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              selectedIndex === index
                ? "bg-gradient-to-r from-blueColorDull/80 to-orangeColorDull w-6"
                : "bg-gray-300 dark:bg-dark-border hover:bg-gray-400 dark:hover:bg-dark-surfaceHover"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
