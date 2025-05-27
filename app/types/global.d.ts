declare global {
  interface Window {
    gtag: (
      command: "config" | "consent" | "event",
      targetId: string | "default" | "update",
      config?: {
        [key: string]: any;
        analytics_storage?: "granted" | "denied";
        ad_storage?: "granted" | "denied";
        wait_for_update?: number;
      }
    ) => void;
    dataLayer: any[];
  }
}

export {};
