"use client";

import { useState, useEffect } from "react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  // Check if user has already made a choice
  useEffect(() => {
    const consent = localStorage.getItem("hexbox-cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    savePreferences(allAccepted);
    updateGoogleConsent(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    savePreferences(onlyNecessary);
    updateGoogleConsent(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    updateGoogleConsent(preferences);
    setShowBanner(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(
      "hexbox-cookie-consent",
      JSON.stringify({
        preferences: prefs,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const updateGoogleConsent = (prefs: CookiePreferences) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: prefs.analytics ? "granted" : "denied",
        ad_storage: prefs.marketing ? "granted" : "denied",
        functionality_storage: prefs.functional ? "granted" : "denied",
        personalization_storage: prefs.marketing ? "granted" : "denied",
      });
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === "necessary") return;

    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Cookie Preferences
            </h2>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              x{" "}
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            We use cookies to enhance your experience, analyze our traffic, and
            for marketing purposes. You can choose which types of cookies you`re
            comfortable with.
          </p>

          {!showDetails ? (
            // Simple view
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-blueColor text-white px-6 py-3 rounded-lg hover:bg-blueColor/80 transition-colors font-medium"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Reject All
                </button>
              </div>
              <button
                onClick={() => setShowDetails(true)}
                className="w-full text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Customize Cookie Settings
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Necessary Cookies
                  </h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      Always Active
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Essential for the website to function properly. These cannot
                  be disabled.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Analytics Cookies
                  </h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => handlePreferenceChange("analytics")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Help us understand how visitors interact with our website by
                  collecting and reporting information anonymously.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Marketing Cookies
                  </h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handlePreferenceChange("marketing")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Used to track visitors across websites to display relevant
                  advertisements and measure campaign effectiveness.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Functional Cookies
                  </h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={() => handlePreferenceChange("functional")}
                      className="w-4 h-4 text-blueColor bg-gray-100 border-gray-300 rounded focus:ring-blueColor/80"
                    />
                    <span className="ml-2 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Enable enhanced functionality like personalized content,
                  social media features, and improved user experience.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blueColor text-white px-6 py-3 rounded-lg hover:bg-blueColor/80 transition-colors font-medium"
                >
                  Save My Preferences
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back to Simple View
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              For more information about how we use cookies, please see our{" "}
              <a
                href="/privacy-policy"
                className="text-blueColor hover:text-blueColor/80 underline"
              >
                Privacy Policy
              </a>
              .
              {/*   or{" "}
              <a
                href="/cookie-settings"
                className="text-blueColor hover:text-blueColor/80 underline"
              >
                Cookie Settings
              </a> */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
