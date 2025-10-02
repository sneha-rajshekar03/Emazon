import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLanguage } from "@app/hooks/useSelectedLanguage";
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
  const brandName = brandTranslations[lang] || "Emzon";

  return (
    <div>
      <Link href="/" className="flex flex-row  ">
        <Image
          src="/logo.svg"
          alt="Amazon Logo"
          width={40}
          height={30}
          className="rounded-full"
        />
        <h1 className="font-semibold p-1 mt-1 justify-center ">{brandName}</h1>
      </Link>
    </div>
  );
};
