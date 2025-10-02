import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export const Language = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [suggestedLangs, setSuggestedLangs] = useState([]);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Language configurations based on location
  const locationLanguages = {
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

  useEffect(() => {
    // Get user location and set suggested languages
    const userCountry = "IN"; // Bengaluru, India
    const languages =
      locationLanguages[userCountry] || locationLanguages.default;
    setSuggestedLangs(languages);

    // Get current language from localStorage or browser
    const savedLang =
      localStorage.getItem("preferredLanguage") ||
      navigator.language.split("-")[0] ||
      "en";
    setSelectedLang(savedLang);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);

    // Save to localStorage
    localStorage.setItem("preferredLanguage", langCode);

    // Change page language attribute
    document.documentElement.lang = langCode;

    // Navigate to the same page but with new locale
    const currentPath = pathname || "/";
    router.push(currentPath, { locale: langCode });
  };

  const currentLang =
    suggestedLangs.find((lang) => lang.code === selectedLang) ||
    suggestedLangs[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span className="text-lg">🌐</span>
        <span className="font-medium">{currentLang?.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase">
            Suggested for your location
          </div>

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
        </div>
      )}
    </div>
  );
};
