"use client";

import Image from "next/image";
import { FC, useEffect, useState } from "react";

interface HexagonImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

const HexagonImage: FC<HexagonImageProps> = ({
  src,
  alt,
  size = 300,
  className = "",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onResize = () => setIsMobile(window.innerWidth < 960);
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  const adjustedSize = isMobile ? size * 0.7 : size;
  const hexHeight = (adjustedSize * Math.sqrt(3)) / 2;

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative bg-lightBlueColor dark:bg-dark-surfaceHover "
        style={{
          width: `${adjustedSize}px`,
          height: `${hexHeight}px`,
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }}
      >
        <div className="w-full h-full relative ">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain p-2"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default HexagonImage;
