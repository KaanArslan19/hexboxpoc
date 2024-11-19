"use client";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

interface HexagonImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  borderWidth?: number;
}

const HexagonImage: FC<HexagonImageProps> = ({
  src,
  alt,
  size = 300,
  className = "",
  borderWidth = 4,
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

  return (
    <div className={`relative group ${className}`}>
      <div
        className="absolute inset-0 blur-md animate-pulse"
        style={{
          width: `${adjustedSize}px`,
          height: `${(adjustedSize * Math.sqrt(3)) / 2}px`,
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          background: "linear-gradient(45deg, #002D5D, #E94E1B, #FFC629)",
          transform: "scale(1.02)",
        }}
      />
      <div
        className="relative"
        style={{
          width: `${adjustedSize}px`,
          height: `${(adjustedSize * Math.sqrt(3)) / 2}px`,
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          padding: borderWidth,
          background: "linear-gradient(45deg, #002D5D, #E94E1B, #FFC629)",
        }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          }}
        >
          <Image
            src={src}
            alt={alt}
            layout="fill"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default HexagonImage;
