import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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

  // Language configurations based on location
  const locationLanguages = {
    "IN-KA": [
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    ],
    "IN-TN": [
      { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    ],
    "IN-AP": [
      { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    ],
    "IN-TG": [
      { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    ],
    "IN-KL": [
      { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    ],
    "IN-MH": [
      { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-WB": [
      { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-GJ": [
      { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-PB": [
      { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-RJ": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-UP": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-MP": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-BR": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-DL": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-HR": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-HP": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-UT": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-JH": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-CT": [
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-OR": [
      { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    "IN-AS": [
      { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    IN: [
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
      { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
      { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
      { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
      { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
      { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
    ],
    US: [
      { code: "en", name: "English", native: "English", flag: "🇺🇸" },
      { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
    ],
    GB: [{ code: "en", name: "English", native: "English", flag: "🇬🇧" }],
    ES: [
      { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    FR: [
      { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    DE: [
      { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    JP: [
      { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    CN: [
      { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    ],
    default: [
      { code: "en", name: "English", native: "English", flag: "🇬🇧" },
      { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
      { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
      { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
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
      setUserLocation(detectedLocation);
      setLoadingProfile(false);

      let languageToUse = null;

      if (savedLanguageFromDB) {
        languageToUse = savedLanguageFromDB;
        setManualOverride(true);
      } else if (locationChanged && languages && languages.length > 0) {
        languageToUse = languages[0].code;
      } else if (languages && languages.length > 0) {
        languageToUse = languages[0].code;
      } else {
        languageToUse = "en";
      }

      setSelectedLang(languageToUse);
      document.documentElement.lang = languageToUse;
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
      flag: "🇬🇧",
    };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        disabled={loadingProfile}
      >
        <span className="text-lg">🌐</span>
        <span className="font-medium">{currentLang?.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase flex items-center justify-between">
            <span>
              {status === "authenticated"
                ? "Suggested for your location"
                : "Select Language"}
            </span>
            {manualOverride && (
              <button
                onClick={resetLanguageOverride}
                className="text-blue-500 hover:text-blue-700 text-xs normal-case font-normal"
                title="Reset to auto-detect based on location"
              >
                🔄 Auto
              </button>
            )}
          </div>

          {manualOverride && (
            <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 mx-2 rounded mb-2">
              💡 Manual selection active. Language won't change with location.
            </div>
          )}

          {suggestedLangs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <div className="font-medium text-gray-900">{lang.name}</div>
                  <div className="text-sm text-gray-500">{lang.native}</div>
                </div>
              </div>
              {selectedLang === lang.code && (
                <span className="text-blue-600 text-xl">✓</span>
              )}
            </button>
          ))}

          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left"
            >
              See all languages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
