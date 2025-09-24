import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  textColor?: string;
  bgColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
  borderColor?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const CustomButton: React.FC<ButtonProps> = ({
  children,
  textColor = "text-black",
  bgColor = "bg-none",
  hoverBgColor = "",
  borderColor = "border-blueColor",
  className = "",
  onClick,
  disabled = false,
}) => {
  // Check if the component should use dynamic theming for text and border
  const useDynamicTheme = className.includes("custom-button-dynamic");

  if (useDynamicTheme) {
    return (
      <button
        disabled={disabled}
        className={`px-4 py-2 rounded-md border-[1px] custom-button-dynamic ${bgColor} ${hoverBgColor} ${className} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  // Alternative: Tailwind dark mode classes
  const useTailwindDarkMode = className.includes("dark-mode-tailwind");

  if (useTailwindDarkMode) {
    return (
      <button
        disabled={disabled}
        className={`px-4 py-2 rounded-md border-[1px] bg-blueColor dark:bg-white text-white dark:text-blueColor border-blueColor dark:border-gray-300 hover:bg-blueColorDull dark:hover:bg-gray-100 transition-all duration-300 ${className} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      className={`px-4 py-2 rounded-md border-[1px] color ${bgColor} ${hoverBgColor} ${borderColor} ${textColor} ${className} transition-all duration-300 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default CustomButton;
