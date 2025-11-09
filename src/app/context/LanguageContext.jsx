"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const LanguageContext = createContext(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  console.log("🟢 LanguageProvider mounted!");

  const [selectedLang, setSelectedLang] = useState("en");
  const [suggestedLangs, setSuggestedLangs] = useState([
    { code: "en", name: "English", native: "English" },
  ]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Add effect to log whenever selectedLang changes
  useEffect(() => {
    console.log("🔵 selectedLang changed to:", selectedLang);
  }, [selectedLang]);

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
      { code: "hi", name: "Hindi", native: "हिन्दী" },
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

  const initializeLanguage = useCallback(
    async (forceRefresh = false) => {
      console.log("🔄 initializeLanguage called, forceRefresh:", forceRefresh);

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
            console.log("📍 Profile data:", data.data);

            if (data.data?.location) {
              detectedLocation = data.data.location;
              locationCode = getLocationCode(detectedLocation);
              console.log(
                "🗺️ Location detected:",
                detectedLocation,
                "→ Code:",
                locationCode
              );
            }
            savedLanguageFromDB = data.data?.preferredLanguage;
            console.log("💾 Saved language from DB:", savedLanguageFromDB);
          }
        } catch (error) {
          console.error("❌ Error fetching profile:", error);
        }
      }

      const locationChanged =
        userLocation !== null && userLocation !== detectedLocation;
      console.log("📊 Location changed?", locationChanged);

      let languages = null;
      if (locationCode) {
        languages = locationLanguages[locationCode];
        console.log("🌍 Languages for", locationCode, ":", languages);
      }

      if (!languages && locationCode?.startsWith("IN")) {
        languages = locationLanguages["IN"];
        console.log("🇮🇳 Using default IN languages:", languages);
      }

      if (!languages) {
        languages = locationLanguages.default;
        console.log("🌐 Using default languages:", languages);
      }

      setSuggestedLangs(languages);

      const wasLocationJustDetected =
        userLocation === null && detectedLocation !== null;

      setUserLocation(detectedLocation);
      setLoadingProfile(false);

      let languageToUse = null;

      if (savedLanguageFromDB) {
        languageToUse = savedLanguageFromDB;
        setManualOverride(true);
        console.log("✅ Using saved language:", languageToUse);
      } else {
        if (languages && languages.length > 0) {
          languageToUse = languages[0].code;
          setManualOverride(false);
          console.log("🎯 Auto-selected language:", languageToUse);
        } else {
          languageToUse = "en";
          setManualOverride(false);
          console.log("⚠️ Fallback to English");
        }
      }

      if (
        languageToUse !== selectedLang ||
        wasLocationJustDetected ||
        locationChanged ||
        forceRefresh
      ) {
        console.log(
          "🔀 Changing language from",
          selectedLang,
          "to",
          languageToUse
        );
        setSelectedLang(languageToUse);
        document.documentElement.lang = languageToUse;

        const currentPath = pathname || "/";
        router.push(currentPath, { locale: languageToUse });
      } else {
        console.log("⏭️ No language change needed");
        setSelectedLang(languageToUse);
        document.documentElement.lang = languageToUse;
      }
    },
    [status, session?.user?.id, userLocation, selectedLang, pathname, router]
  );

  useEffect(() => {
    if (status !== "loading") {
      initializeLanguage();
    }
  }, [status, session?.user?.id, initializeLanguage]);

  useEffect(() => {
    const handleLocationUpdate = () => {
      console.log("📢 Location update event received");
      setTimeout(() => {
        initializeLanguage(true);
      }, 100);
    };

    window.addEventListener("locationUpdated", handleLocationUpdate);
    return () =>
      window.removeEventListener("locationUpdated", handleLocationUpdate);
  }, [initializeLanguage]);

  const handleLanguageSelect = async (langCode) => {
    console.log("🎯 handleLanguageSelect called with:", langCode);

    setSelectedLang(langCode);
    setManualOverride(true);
    document.documentElement.lang = langCode;

    if (status === "authenticated" && session?.user?.id) {
      try {
        console.log("💾 Saving language to DB:", langCode);

        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            preferredLanguage: langCode,
          }),
        });

        const result = await response.json();
        console.log("📥 Save response:", result);

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
    console.log("🔄 Resetting language override");
    setManualOverride(false);

    if (status === "authenticated" && session?.user?.id) {
      try {
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
          console.log("✅ Reset to:", primaryLang);
          setSelectedLang(primaryLang);
          document.documentElement.lang = primaryLang;

          const currentPath = pathname || "/";
          router.push(currentPath, { locale: primaryLang });
        }
      } catch (error) {
        console.error("❌ Error resetting language:", error);
      }
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        selectedLang,
        setSelectedLang,
        suggestedLangs,
        loadingProfile,
        userLocation,
        manualOverride,
        handleLanguageSelect,
        resetLanguageOverride,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
