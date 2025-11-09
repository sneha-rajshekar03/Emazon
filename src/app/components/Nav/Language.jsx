"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useColor } from "@/app/context/ColorContext";
import { Globe } from "lucide-react";

// All available languages
const ALL_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
];

export const Language = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const dropdownRef = useRef(null);
  const { hexColor, isDarkMode } = useColor();
  const {
    selectedLang,
    suggestedLangs,
    loadingProfile,
    manualOverride,
    handleLanguageSelect,
    resetLanguageOverride,
  } = useLanguage();

  // Memoize click outside handler
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
      setShowAllLanguages(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Memoize current language calculation
  const currentLang = useMemo(() => {
    const lang = suggestedLangs.find((lang) => lang.code === selectedLang) ||
      ALL_LANGUAGES.find((lang) => lang.code === selectedLang) ||
      suggestedLangs[0] || { code: "en", name: "English", native: "English" };

    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔤 Current language display:",
        lang.code.toUpperCase(),
        "Selected:",
        selectedLang
      );
    }

    return lang;
  }, [suggestedLangs, selectedLang]);

  // Memoize button styles
  const buttonStyle = useMemo(
    () => ({
      background: isOpen ? `${hexColor}10` : "transparent",
    }),
    [isOpen, hexColor]
  );

  // Memoize dropdown styles
  const dropdownStyle = useMemo(
    () => ({
      background: isDarkMode
        ? "rgba(45, 45, 45, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderColor: `${hexColor}15`,
      boxShadow: isDarkMode
        ? `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 0.5px ${hexColor}10`
        : `0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 0.5px ${hexColor}10`,
    }),
    [isDarkMode, hexColor]
  );

  // Memoize language selection handler
  const handleLanguageClick = useCallback(
    (langCode) => {
      handleLanguageSelect(langCode);
      setIsOpen(false);
      setShowAllLanguages(false);
    },
    [handleLanguageSelect]
  );

  // Memoize languages to display
  const displayLanguages = useMemo(
    () => (showAllLanguages ? ALL_LANGUAGES : suggestedLangs),
    [showAllLanguages, suggestedLangs]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`
        .language-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .language-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .language-scroll-container::-webkit-scrollbar-thumb {
          background: ${hexColor}40;
          border-radius: 4px;
        }
        .language-scroll-container::-webkit-scrollbar-thumb:hover {
          background: ${hexColor}80;
        }
        .language-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: ${hexColor}40 transparent;
        }
      `}</style>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingProfile}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
        }`}
        style={buttonStyle}
        aria-label="Select language"
        aria-expanded={isOpen}
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

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-xl border shadow-lg overflow-hidden z-50"
          style={dropdownStyle}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: `${hexColor}10` }}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {showAllLanguages
                  ? "All Languages"
                  : "Suggested for your location"}
              </span>
              {manualOverride && !showAllLanguages && (
                <button
                  onClick={resetLanguageOverride}
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: hexColor }}
                  title="Reset to auto-detect based on location"
                  aria-label="Reset to auto language"
                >
                  🔄 Auto
                </button>
              )}
              {showAllLanguages && (
                <button
                  onClick={() => setShowAllLanguages(false)}
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: hexColor }}
                  aria-label="Back to suggested"
                >
                  ← Back
                </button>
              )}
            </div>
            {manualOverride && !showAllLanguages && (
              <div
                className="mt-2 text-xs rounded-md px-3 py-1.5"
                style={{ background: `${hexColor}10`, color: hexColor }}
              >
                💡 Manual selection active. Language won't change with location.
              </div>
            )}
          </div>

          <div
            className={showAllLanguages ? "language-scroll-container" : "py-1"}
            style={
              showAllLanguages
                ? {
                    maxHeight: "320px",
                    overflowY: "auto",
                    paddingTop: "0.25rem",
                    paddingBottom: "0.25rem",
                  }
                : {}
            }
          >
            {displayLanguages.map((lang) => (
              <LanguageOption
                key={lang.code}
                lang={lang}
                isSelected={selectedLang === lang.code}
                hexColor={hexColor}
                isDarkMode={isDarkMode}
                onSelect={handleLanguageClick}
              />
            ))}
          </div>

          {!showAllLanguages && (
            <div
              className="border-t px-4 py-2.5"
              style={{ borderColor: `${hexColor}10` }}
            >
              <button
                onClick={() => setShowAllLanguages(true)}
                className="w-full text-sm font-medium text-left transition-colors hover:opacity-80"
                style={{ color: hexColor }}
              >
                See all languages →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate memoized component for language options
const LanguageOption = React.memo(
  ({ lang, isSelected, hexColor, isDarkMode, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = useMemo(
      () => ({
        background: isSelected
          ? `${hexColor}08`
          : isHovered
          ? `${hexColor}05`
          : "transparent",
      }),
      [isSelected, isHovered, hexColor]
    );

    return (
      <button
        onClick={() => onSelect(lang.code)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
        {isSelected && (
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
    );
  }
);

LanguageOption.displayName = "LanguageOption";
