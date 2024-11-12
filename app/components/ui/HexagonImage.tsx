import Image from "next/image";
import { FC } from "react";

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
  size = 200,
  className = "",
  borderWidth = 4,
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div
        className="absolute inset-0 blur-md animate-pulse"
        style={{
          width: `${size}px`,
          height: `${(size * Math.sqrt(3)) / 2}px`,
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          background: "linear-gradient(45deg, #002D5D, #E94E1B, #FFC629)",
          transform: "scale(1.02)",
        }}
      />

      <div
        className="relative"
        style={{
          width: `${size}px`,
          height: `${(size * Math.sqrt(3)) / 2}px`,
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
          <div className="relative w-full h-full ">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes={`${size}px`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexagonImage;
