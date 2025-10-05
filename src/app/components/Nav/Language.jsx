"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useColor } from "@app/context/ColorContext";
import { Globe } from "lucide-react";

export const Language = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [suggestedLangs, setSuggestedLangs] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hexColor, isDarkMode } = useColor();

  // Language configurations based on location
  const locationLanguages = {
    "IN-KA": [
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
    ],
    "IN-TN": [
      { code: "ta", name: "Tamil", native: "தமிழ்" },
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
    ],
    "IN-AP": [
      { code: "te", name: "Telugu", native: "తెలుగు" },
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
    ],
    "IN-TG": [
      { code: "te", name: "Telugu", native: "తెలుగు" },
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
    ],
    "IN-KL": [
      { code: "ml", name: "Malayalam", native: "മലയാളം" },
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
    ],
    "IN-MH": [
      { code: "mr", name: "Marathi", native: "मराठी" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-WB": [
      { code: "bn", name: "Bengali", native: "বাংলা" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-GJ": [
      { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-PB": [
      { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-RJ": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-UP": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-MP": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-BR": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-DL": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-HR": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-HP": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-UT": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-JH": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-CT": [
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-OR": [
      { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    "IN-AS": [
      { code: "as", name: "Assamese", native: "অসমীয়া" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "en", name: "English", native: "English" },
    ],
    IN: [
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    ],
    US: [
      { code: "en", name: "English", native: "English" },
      { code: "es", name: "Spanish", native: "Español" },
    ],
    GB: [{ code: "en", name: "English", native: "English" }],
    ES: [
      { code: "es", name: "Spanish", native: "Español" },
      { code: "en", name: "English", native: "English" },
    ],
    FR: [
      { code: "fr", name: "French", native: "Français" },
      { code: "en", name: "English", native: "English" },
    ],
    DE: [
      { code: "de", name: "German", native: "Deutsch" },
      { code: "en", name: "English", native: "English" },
    ],
    JP: [
      { code: "ja", name: "Japanese", native: "日本語" },
      { code: "en", name: "English", native: "English" },
    ],
    CN: [
      { code: "zh", name: "Chinese", native: "中文" },
      { code: "en", name: "English", native: "English" },
    ],
    default: [
      { code: "en", name: "English", native: "English" },
      { code: "es", name: "Spanish", native: "Español" },
      { code: "fr", name: "French", native: "Français" },
    ],
  };

  const getLocationCode = (location) => {
    if (!location) return null;

    const parts = location.split(",").map((part) => part.trim());

    const indianStates = {
      Karnataka: "IN-KA",
      "Tamil Nadu": "IN-TN",
      "Andhra Pradesh": "IN-AP",
      Telangana: "IN-TG",
      Kerala: "IN-KL",
      Maharashtra: "IN-MH",
      "West Bengal": "IN-WB",
      Gujarat: "IN-GJ",
      Punjab: "IN-PB",
      Rajasthan: "IN-RJ",
      "Uttar Pradesh": "IN-UP",
      "Madhya Pradesh": "IN-MP",
      Bihar: "IN-BR",
      Delhi: "IN-DL",
      Haryana: "IN-HR",
      "Himachal Pradesh": "IN-HP",
      Uttarakhand: "IN-UT",
      Jharkhand: "IN-JH",
      Chhattisgarh: "IN-CT",
      Odisha: "IN-OR",
      Assam: "IN-AS",
    };

    for (let i = 0; i < parts.length; i++) {
      if (indianStates[parts[i]]) {
        return indianStates[parts[i]];
      }
    }

    const lastPart = parts[parts.length - 1];
    const countryMap = {
      India: "IN",
      "United States": "US",
      USA: "US",
      "United Kingdom": "GB",
      UK: "GB",
      Spain: "ES",
      France: "FR",
      Germany: "DE",
      Japan: "JP",
      China: "CN",
    };

    return countryMap[lastPart] || null;
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      let locationCode = null;
      let detectedLocation = null;
      let savedLanguageFromDB = null;

      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(
            `/api/profile?userId=${session.user.id}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.data?.location) {
              detectedLocation = data.data.location;
              locationCode = getLocationCode(detectedLocation);
            }
            savedLanguageFromDB = data.data?.preferredLanguage;
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }

      const locationChanged =
        userLocation !== null && userLocation !== detectedLocation;

      let languages = null;
      if (locationCode) {
        languages = locationLanguages[locationCode];
      }

      if (!languages && locationCode?.startsWith("IN")) {
        languages = locationLanguages["IN"];
      }

      if (!languages) {
        languages = locationLanguages.default;
      }

      setSuggestedLangs(languages);

      // Check if location was just detected and saved
      const wasLocationJustDetected =
        userLocation === null && detectedLocation !== null;

      setUserLocation(detectedLocation);
      setLoadingProfile(false);

      let languageToUse = null;

      // Manual override always takes preference
      if (savedLanguageFromDB) {
        languageToUse = savedLanguageFromDB;
        setManualOverride(true);
      } else {
        // No manual override - use location-based auto-detection
        if (languages && languages.length > 0) {
          languageToUse = languages[0].code;
          setManualOverride(false);
        } else {
          languageToUse = "en";
          setManualOverride(false);
        }
      }

      // Only update and navigate if language actually changed OR location was just detected
      if (languageToUse !== selectedLang || wasLocationJustDetected) {
        setSelectedLang(languageToUse);
        document.documentElement.lang = languageToUse;

        console.log(
          `🌍 Location detected: ${detectedLocation}, switching to: ${languageToUse}`
        );

        // Auto-navigate to new language
        const currentPath = pathname || "/";
        router.push(currentPath, { locale: languageToUse });
      } else {
        // Still update state even if language didn't change
        setSelectedLang(languageToUse);
        document.documentElement.lang = languageToUse;
      }
    };

    if (status !== "loading") {
      initializeLanguage();
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = async (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    setManualOverride(true);

    document.documentElement.lang = langCode;

    if (status === "authenticated" && session?.user?.id) {
      try {
        console.log("🌐 Sending language update:", {
          userId: session.user.id,
          preferredLanguage: langCode,
        });

        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            preferredLanguage: langCode,
          }),
        });

        const result = await response.json();
        console.log("📥 Language update response:", result);

        if (!response.ok) {
          console.error("❌ Failed to save language preference:", result);
        } else {
          console.log("✅ Language saved successfully");
        }
      } catch (error) {
        console.error("❌ Error saving language:", error);
      }
    }

    const currentPath = pathname || "/";
    router.push(currentPath, { locale: langCode });
  };

  const resetLanguageOverride = async () => {
    setManualOverride(false);

    if (status === "authenticated" && session?.user?.id) {
      try {
        console.log("🔄 Resetting language preference to auto-detect");

        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            preferredLanguage: null,
          }),
        });

        const result = await response.json();
        console.log("📥 Reset response:", result);

        if (response.ok && suggestedLangs && suggestedLangs.length > 0) {
          const primaryLang = suggestedLangs[0].code;
          setSelectedLang(primaryLang);
          document.documentElement.lang = primaryLang;

          const currentPath = pathname || "/";
          router.push(currentPath, { locale: primaryLang });
          console.log("✅ Language reset to auto-detect:", primaryLang);
        }
      } catch (error) {
        console.error("❌ Error resetting language:", error);
      }
    }
  };

  const currentLang = suggestedLangs.find(
    (lang) => lang.code === selectedLang
  ) ||
    suggestedLangs[0] || {
      code: "en",
      name: "English",
      native: "English",
    };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingProfile}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
        }`}
        style={{
          background: isOpen ? `${hexColor}10` : "transparent",
        }}
      >
        <Globe
          className={`w-4 h-4 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
          strokeWidth={2}
        />
        <span
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {currentLang?.code.toUpperCase()}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-xl border shadow-lg overflow-hidden z-50"
          style={{
            background: isDarkMode
              ? "rgba(45, 45, 45, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderColor: `${hexColor}15`,
            boxShadow: isDarkMode
              ? `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 0.5px ${hexColor}10`
              : `0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 0.5px ${hexColor}10`,
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: `${hexColor}10`,
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {status === "authenticated"
                  ? "Suggested for your location"
                  : "Select Language"}
              </span>

              {manualOverride && (
                <button
                  onClick={resetLanguageOverride}
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: hexColor }}
                  title="Reset to auto-detect based on location"
                >
                  🔄 Auto
                </button>
              )}
            </div>

            {manualOverride && (
              <div
                className="mt-2 text-xs rounded-md px-3 py-1.5"
                style={{
                  background: `${hexColor}10`,
                  color: hexColor,
                }}
              >
                💡 Manual selection active. Language won't change with location.
              </div>
            )}
          </div>

          {/* Language List */}
          <div className="py-1">
            {suggestedLangs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors"
                style={{
                  background:
                    selectedLang === lang.code
                      ? `${hexColor}08`
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (selectedLang !== lang.code) {
                    e.currentTarget.style.background = `${hexColor}05`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLang !== lang.code) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {lang.name}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {lang.native}
                  </div>
                </div>
                {selectedLang === lang.code && (
                  <svg
                    className="w-4 h-4"
                    style={{ color: hexColor }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div
            className="border-t px-4 py-2.5"
            style={{
              borderColor: `${hexColor}10`,
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm font-medium text-left transition-colors hover:opacity-80"
              style={{ color: hexColor }}
            >
              See all languages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
