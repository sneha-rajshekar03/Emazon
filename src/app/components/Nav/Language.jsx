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
  const [manualOverride, setManualOverride] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hexColor, isDarkMode } = useColor();

  // Languages based on location
  const locationLanguages = {
    IN: [
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिन्दी" },
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    ],
    default: [
      { code: "en", name: "English", native: "English" },
      { code: "es", name: "Spanish", native: "Español" },
      { code: "fr", name: "French", native: "Français" },
    ],
  };

  useEffect(() => {
    setSuggestedLangs(locationLanguages["IN"]);
    setSelectedLang("en");
    setLoadingProfile(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    document.documentElement.lang = langCode;
  };

  const currentLang = suggestedLangs.find(
    (lang) => lang.code === selectedLang
  ) || {
    code: "en",
    name: "English",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          {currentLang.code.toUpperCase()}
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
                  ? "Suggested for you"
                  : "Select Language"}
              </span>

              {manualOverride && (
                <button
                  onClick={() => setManualOverride(false)}
                  className="text-xs font-medium transition-colors"
                  style={{ color: hexColor }}
                >
                  Auto
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
                Manual mode active
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
              className="w-full text-sm font-medium text-left transition-colors"
              style={{ color: hexColor }}
            >
              See all languages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
