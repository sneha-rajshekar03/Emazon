import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLanguage } from "@app/hooks/useSelectedLanguage";
import { useColor } from "@app/context/ColorContext";

export const Logo = () => {
  const brandTranslations = {
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

  const lang = useSelectedLanguage();
  const { isDarkMode } = useColor();
  const brandName = brandTranslations[lang] || "Emzon";

  // Use dark logo when dark mode is enabled
  const logoSrc = isDarkMode ? "/logodark.png" : "/logo.svg";

  return (
    <div>
      <Link href="/" className="flex flex-row items-center gap-2">
        <div
          className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center ${
            isDarkMode ? "border-white" : "border-black"
          }`}
        >
          <Image
            src={logoSrc}
            alt="Amazon Logo"
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="font-semibold">{brandName}</h1>
      </Link>
    </div>
  );
};
