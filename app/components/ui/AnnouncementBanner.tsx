"use client";

import React from "react";
import { BarChart3, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

export default function AnnouncementBanner() {
  return (
    <Link href="/announcement" target="_blank" className="no-underline ">
      <div className="w-full bg-gradient-to-r from-blueColor via-blueColorDull to-orangeColor/70 py-4 px-6 shadow-lg border-y border-blueColor/20">
        <div className="max-w-6xl mx-auto overflow-hidden">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 animate-pulse">
              <BarChart3 className="text-white h-6 w-6" />
              <div className="h-2 w-2 bg-white animate-ping clip-hexagon"></div>
              <div className="h-2 w-2 bg-white/70 animate-ping delay-100 clip-hexagon"></div>
              <div className="h-2 w-2 bg-white/50 animate-ping delay-200 clip-hexagon"></div>
            </div>

            <div className="flex-1 mx-6 overflow-hidden">
              <div className="whitespace-nowrap animate-slide text-white font-semibold text-lg tracking-wide">
                <span className="inline-block px-8">
                  🚀 COMING SOON: Advanced Analytics Dashboard
                </span>
                <span className="inline-block px-8">
                  📊 Track Your Campaign Performance in Real-Time
                </span>
                <span className="inline-block px-8">
                  💡 Get Detailed Insights & Growth Metrics
                </span>
                <span className="inline-block px-8">
                  📈 Optimize Your Fundraising Strategy
                </span>
                <span className="inline-block px-8">
                  🎯 Make Data-Driven Decisions
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <TrendingUp className="text-white h-6 w-6 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
