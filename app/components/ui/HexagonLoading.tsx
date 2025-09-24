"use client";
import Image from "next/image";
import React from "react";
import { useTheme } from "next-themes";
import logoBlack from "../../../public/hexbox_black_logo.svg";
import logoWhite from "../../../public/hexbox_white_logo.svg";
export default function HexagonLoading() {
  const { theme } = useTheme();
  const currentLogo = theme === "dark" ? logoWhite : logoBlack;
  return (
    <div className="my-40 flex justify-center animate-spin-slow ">
      <Image src={currentLogo} alt="loading-spinner" width={60} height={60} />
    </div>
  );
}
