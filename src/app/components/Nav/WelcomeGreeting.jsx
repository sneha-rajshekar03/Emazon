"use client";

import React, { useState, useEffect } from "react";

export const WelcomeGreeting = ({ isDarkMode, hexColor, userName }) => {
  const [greeting, setGreeting] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Extract first name
    const firstName = userName?.split(" ")[0] || userName;

    // Generate greeting based on time of day
    const hour = new Date().getHours();
    let timeGreeting;

    if (hour >= 0 && hour < 6) {
      timeGreeting = `Hey Night Owl! Let's shop, ${firstName}`;
    } else if (hour >= 6 && hour < 8) {
      timeGreeting = `Hey Early Bird! Let's grab our products, ${firstName}`;
    } else if (hour >= 8 && hour < 12) {
      timeGreeting = `Good Morning, ${firstName}! Welcome to Emzon`;
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = `Good Afternoon, ${firstName}! Let's shop`;
    } else if (hour >= 18 && hour < 21) {
      timeGreeting = `Good Evening, ${firstName}! Welcome to Emzon`;
    } else {
      timeGreeting = `Ready for your after-dinner shopping, ${firstName}?`;
    }

    setGreeting(timeGreeting);

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [userName]);

  if (!isVisible) return null;

  const themeColor = hexColor || (isDarkMode ? "#A0A0A0" : "#D0D3D7");

  return (
    <div
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-full shadow-lg animate-fadeIn"
      style={{
        background: isDarkMode
          ? `linear-gradient(135deg, ${themeColor}20 0%, rgba(40,40,40,0.95) 100%)`
          : `linear-gradient(135deg, ${themeColor}25 0%, rgba(255,255,255,0.95) 100%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${themeColor}30`,
        boxShadow: isDarkMode
          ? `0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 4px 15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)`,
      }}
    >
      <p
        className={`text-sm font-medium ${
          isDarkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {greeting}
      </p>
    </div>
  );
};
