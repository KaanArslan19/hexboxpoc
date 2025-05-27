"use client";

import CookieConsent from "react-cookie-consent";

const CookieConsentBanner = () => {
  const handleAccept = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });
    }
    console.log("Cookies accepted");
  };

  const handleDecline = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });
    }
    console.log("Cookies declined");
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All Cookies"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={handleAccept}
      onDecline={handleDecline}
      style={{
        background: "#2B373B",
        fontSize: "16px",
        fontFamily: "inherit",
      }}
      buttonStyle={{
        background: "#4F46E5",
        color: "white",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "10px 20px",
        border: "none",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#9CA3AF",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "10px 20px",
        border: "1px solid #9CA3AF",
        cursor: "pointer",
        marginRight: "10px",
      }}
      expires={365}
      cookieName="hexbox-cookie-consent"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <p className="text-white mb-2">
            We use cookies to enhance your experience and analyze our traffic.
          </p>
          <p className="text-gray-300 text-sm">
            By clicking `Accept All Cookies`, you agree to our use of cookies
            for analytics and marketing purposes.{" "}
            <a
              href="/privacy-policy"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Learn more in our Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </CookieConsent>
  );
};

export default CookieConsentBanner;
