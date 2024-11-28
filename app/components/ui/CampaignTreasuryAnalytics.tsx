"use client";
import { TokenDetailsProps, WalletDetails } from "@/app/types";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { AddressSection } from "./AddressSection";
import { HolderItem } from "./HolderItem";
interface Holder {
  address: string;
  balance: number;
}

export default function CampaignTreasuryAnalytics({
  holders,
  supply,
  available_supply,
  total_funds,
  token_address,
  wallet_address,
}: TokenDetailsProps & WalletDetails & { wallet_address: string }) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: Holder & { percentage: number };
  } | null>(null);

  const [dimensions, setDimensions] = useState({
    width: 200,
    height: 200,
  });

  useEffect(() => {
    const onResize = () =>
      window.innerWidth >= 960 && setDimensions({ width: 400, height: 400 });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalSupply = holders.reduce((sum, holder) => sum + holder.balance, 0);

  const data = holders
    .map((holder) => ({
      ...holder,
      percentage: (holder.balance / totalSupply) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const radius = Math.min(dimensions.width, dimensions.height) / 2.5;

  const pie = d3.pie<(typeof data)[0]>().value((d) => d.percentage);
  const arc = d3
    .arc<d3.PieArcDatum<(typeof data)[0]>>()
    .innerRadius(0)
    .outerRadius(radius)
    .padAngle(0.01);

  const colorScale = d3
    .scaleSequential()
    .domain([0, data.length])
    .interpolator(d3.interpolateViridis);

  const handleMouseEnter = (
    event: React.MouseEvent<SVGPathElement, MouseEvent>,
    slice: d3.PieArcDatum<Holder & { percentage: number }>
  ) => {
    const { clientX, clientY } = event;
    setTooltip({
      x: clientX,
      y: clientY,
      data: slice.data,
    });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-4">
      <div className="flex w-full flex-wrap items-center pb-4">
        <div className="rounded-lg bg-smoke-50 pb-5 dark:bg-slate-700 w-full min-w-min flex-[1_0_0]">
          <AddressSection
            token_address={token_address}
            wallet_address={wallet_address}
            available_supply={available_supply}
            supply={supply}
            total_funds={total_funds}
          />
        </div>
      </div>
      <div className="flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
        >
          <g
            transform={`translate(${dimensions.width / 2},${
              dimensions.height / 2
            })`}
          >
            {pie(data).map((slice, index) => (
              <path
                key={slice.data.address}
                d={arc(slice) || ""}
                fill={colorScale(index) as string}
                className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                onMouseEnter={(e) => handleMouseEnter(e, slice)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </g>
        </svg>

        {tooltip && (
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
            }}
          >
            <div className="font-bold mb-2 text-sm truncate">
              Address: {tooltip.data.address}
            </div>
            <div className="text-sm">
              <div>Balance: {tooltip.data.balance.toLocaleString()}</div>
              <div>Percentage: {tooltip.data.percentage.toFixed(2)}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {data.map((holder, index) => (
          <HolderItem
            key={holder.address}
            address={holder.address}
            colorScale={colorScale}
            balance={holder.balance}
            percentage={holder.percentage}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
