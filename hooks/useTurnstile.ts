// hooks/useTurnstile.ts
import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

interface UseTurnstileOptions {
  sitekey: string;
  onVerify?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

export const useTurnstile = (options: UseTurnstileOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to prevent re-renders
  const onVerifyRef = useRef(options.onVerify);
  const onErrorRef = useRef(options.onError);
  const onExpireRef = useRef(options.onExpire);

  // Update refs when callbacks change
  useEffect(() => {
    onVerifyRef.current = options.onVerify;
    onErrorRef.current = options.onError;
    onExpireRef.current = options.onExpire;
  }, [options.onVerify, options.onError, options.onExpire]);

  useEffect(() => {
    // Load Turnstile script
    const loadTurnstile = () => {
      if (window.turnstile) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setError("Failed to load Turnstile");
      document.head.appendChild(script);
    };

    loadTurnstile();
  }, []);

  useEffect(() => {
    if (
      isLoaded &&
      containerRef.current &&
      !widgetIdRef.current &&
      !isVerified
    ) {
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: options.sitekey,
          callback: (token: string) => {
            setToken(token);
            setIsVerified(true);
            setError(null);
            onVerifyRef.current?.(token);
          },
          "error-callback": () => {
            setToken(null);
            setIsVerified(false);
            setError("Verification failed");
            onErrorRef.current?.();
          },
          "expired-callback": () => {
            setToken(null);
            setIsVerified(false);
            setError("Verification expired");
            onExpireRef.current?.();
          },
          theme: options.theme || "light",
          size: options.size || "normal",
        });
      } catch (err) {
        setError("Failed to render Turnstile widget");
        console.error("Turnstile render error:", err);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.error("Error removing Turnstile widget:", err);
        }
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded, options.sitekey, options.theme, options.size]);

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setToken(null);
        setIsVerified(false);
        setError(null);
        widgetIdRef.current = null; // Allow widget to be recreated
      } catch (err) {
        console.error("Error resetting Turnstile:", err);
      }
    }
  };

  const getResponse = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        return window.turnstile.getResponse(widgetIdRef.current);
      } catch (err) {
        console.error("Error getting Turnstile response:", err);
        return null;
      }
    }
    return null;
  };

  return {
    containerRef,
    token,
    isVerified,
    error,
    isLoaded,
    reset,
    getResponse,
  };
};
