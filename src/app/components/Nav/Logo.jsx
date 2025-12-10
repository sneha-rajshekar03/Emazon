"use client";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useColor } from "@/app/context/ColorContext";

export default function Logo() {
  const { selectedLang } = useLanguage();
  const { isDarkMode, hexColor } = useColor();

  // 🌐 Dynamic logo text translations
  const logoTranslations = {
    en: "Emzon",
    hi: "एमज़ोन",
    kn: "ಎಮ್ಜೋನ್",
    ta: "எம்சோன்",
    te: "ఎమ్జోన్",
    ml: "എംസോൺ",
    mr: "एमझोन",
    bn: "এমজোন",
    gu: "એમઝોન",
    pa: "ਐਮਜੋਨ",
    or: "ଏମଜୋନ",
    ja: "エムゾン",
    zh: "艾姆宗",
    ar: "أمازون",
    fr: "Emzon",
    de: "Emzon",
    es: "Emzon",
    ru: "Эмзон",
    ko: "엠존",
  };

  const logoText = logoTranslations[selectedLang] || "Emzon";

  return (
    <Link
      href="/"
      className="flex items-center gap-2 group transition-all duration-300"
      aria-label={`${logoText} Home`}
    >
      {/* 🌈 Circular Logo with Border Glow (No gap between image and border) */}
      <div
        className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{
          border: `2px solid ${hexColor || "#007AFF"}`,
          boxShadow: `0 0 10px ${hexColor || "#007AFF"}40`,
          background: isDarkMode
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        {/* 🌀 Inner Image (perfectly fits inside border) */}
        <Image
          src="/logo.svg"
          alt={`${logoText} Logo`}
          width={48}
          height={48}
          priority
          className="rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
        />
      </div>

      {/* 📝 Logo Text (Bold and Clean) */}
      <span
        className={`text-[1rem] font-bold tracking-tight transition-all duration-300 ${
          isDarkMode ? "text-gray-200" : "text-gray-900"
        } group-hover:opacity-90`}
        style={{
          letterSpacing: "-0.015em",
        }}
      >
        {logoText}
      </span>
    </Link>
  );
}
