// hooks/useSelectedLanguage.js
import { useState, useEffect } from "react";

export const useSelectedLanguage = () => {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const storedLang = document.documentElement.lang || "en";
    setLang(storedLang);

    // Listen for language changes
    const observer = new MutationObserver(() => {
      setLang(document.documentElement.lang || "en");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  return lang;
};
