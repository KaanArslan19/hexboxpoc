// components/ui/TurnstileWidget.tsx
import React from "react";
import { useTurnstile } from "@/hooks/useTurnstile";

interface TurnstileWidgetProps {
  sitekey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  sitekey,
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal",
  className = "",
}) => {
  const { containerRef, token, isVerified, error, isLoaded, reset } =
    useTurnstile({
      sitekey,
      onVerify,
      onError,
      onExpire,
      theme,
      size,
    });

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} />

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-2 text-red-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-2 text-green-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification successful
          </div>
        </div>
      )}

      {!isLoaded && !error && (
        <div className="mt-2 text-sm text-gray-500">
          Loading verification...
        </div>
      )}
    </div>
  );
};

export default TurnstileWidget;
