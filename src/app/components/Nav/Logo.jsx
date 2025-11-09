import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useColor } from "@/app/context/ColorContext";

// Move translations outside component to avoid recreation
const BRAND_TRANSLATIONS = {
  en: "Emzon",
  hi: "एमज़ोन",
  kn: "ಎಮ್ಝೋನ್",
  ta: "எம்ஸான்",
  te: "ఎమ్జోన్",
  ml: "എംസോൺ",
  mr: "एम्झोन",
  bn: "এমজন",
  gu: "એમઝોન",
  pa: "ਐਮਜ਼ੋਨ",
  or: "ଏମଜୋନ",
  as: "এমজোন",
  es: "Emzon",
  fr: "Emzon",
  de: "Emzon",
  ja: "エムゾン",
  zh: "艾姆逊",
};

// Don't use React.memo here - we WANT it to re-render on language change
export const Logo = () => {
  const { selectedLang } = useLanguage();
  const { hexColor, isDarkMode } = useColor();

  // Memoize brand name calculation
  const brandName = useMemo(
    () => BRAND_TRANSLATIONS[selectedLang] || "Emzon",
    [selectedLang]
  );

  // Memoize logo source
  const logoSrc = useMemo(
    () => (isDarkMode ? "/logodark.png" : "/logo.svg"),
    [isDarkMode]
  );

  // Memoize border style
  const borderStyle = useMemo(() => ({ borderColor: hexColor }), [hexColor]);

  return (
    <Link href="/" className="flex flex-row items-center gap-2">
      <div
        className="w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center"
        style={borderStyle}
      >
        <Image
          src={logoSrc}
          alt="Emzon Logo"
          width={40}
          height={40}
          className="object-cover w-full h-full"
          priority
        />
      </div>
      <h1 className="font-semibold">{brandName}</h1>
    </Link>
  );
};
