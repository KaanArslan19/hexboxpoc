// HexagonLoading.tsx
import Image from "next/image";
import React from "react";

export default function HexagonLoading() {
  return (
    <div className="my-40 flex justify-center animate-spin-slow ">
      <Image
        src="/hexbox_black_logo.svg"
        alt="loading-spinner"
        width={60}
        height={60}
      />
    </div>
  );
}
