"use client";
import React from "react";
import { useColor } from "@app/context/ColorContext";

const NewsLetter = () => {
  const { hexColor, isDarkMode } = useColor();

  return (
    <div
      className="flex flex-col items-center justify-center text-center space-y-2 pt-10 pb-14 mx-4 my-10 transition-all duration-500"
      style={{
        background: isDarkMode
          ? `linear-gradient(
              160deg,
              rgba(40,40,40,0.75) 0%,
              rgba(30,30,30,0.35) 100%
            )`
          : `linear-gradient(
              160deg,
              rgba(255,255,255,0.75) 0%,
              rgba(255,255,255,0.35) 100%
            )`,
        backdropFilter: "blur(25px) saturate(200%)",
        WebkitBackdropFilter: "blur(25px) saturate(200%)",
        border: "none",
        boxShadow: isDarkMode
          ? "0 8px 40px rgba(0,0,0,0.3)"
          : "0 8px 40px rgba(0,0,0,0.06)",
      }}
    >
      <h1
        className={`md:text-4xl text-2xl font-semibold tracking-tight ${
          isDarkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        Subscribe now & get 20% off
      </h1>
      <p
        className={`md:text-base pb-8 max-w-xl leading-relaxed ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </p>

      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12 px-4">
        <input
          className={`h-full w-full rounded-l-xl px-4 text-sm outline-none transition-all duration-300 ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
          }`}
          type="email"
          placeholder="Enter your email"
          style={{
            background: isDarkMode
              ? "rgba(50,50,50,0.6)"
              : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: isDarkMode
              ? "inset 0 0 8px rgba(255,255,255,0.05)"
              : "inset 0 0 8px rgba(255,255,255,0.2)",
            border: "none",
          }}
          onFocus={(e) => {
            e.target.style.background = isDarkMode
              ? "rgba(60,60,60,0.85)"
              : "rgba(255,255,255,0.85)";
          }}
          onBlur={(e) => {
            e.target.style.background = isDarkMode
              ? "rgba(50,50,50,0.6)"
              : "rgba(255,255,255,0.6)";
          }}
        />

        <button
          className="md:px-12 px-8 h-full text-white font-medium rounded-r-xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
          style={{
            background: `linear-gradient(135deg, ${hexColor} 0%, ${hexColor}cc 100%)`,
          }}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
