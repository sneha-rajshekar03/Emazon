"use client";
import React, { useEffect, useState, useRef } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { useColor } from "@app/context/ColorContext";

export const ProfilePopup = ({
  profile,
  currentQuestion,
  answer,
  setAnswer,
  selectedHobbies,
  locationLoading,
  setLocationLoading,
  handleClose,
  handleSave,
  saving,
  isAnswerValid,
  toggleHobby,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7);
  const [isPaused, setIsPaused] = useState(false);
  const { hexColor, isDarkMode } = useColor();
  const countdownRef = useRef(null);
  const popupRef = useRef(null);

  // Show popup and reset timer
  useEffect(() => {
    if (!currentQuestion) return;
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    setTimeLeft(7);
    setIsPaused(false);
    return () => {
      clearTimeout(showTimer);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentQuestion]);

  // Handle countdown logic
  useEffect(() => {
    if (!currentQuestion || isPaused) return;

    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentQuestion, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const detectLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          setAnswer(
            `${data.city}, ${data.principalSubdivision}, ${data.countryName}`
          );
        } catch {
          setAnswer(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(
              4
            )}`
          );
        }
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        alert("Unable to get location");
      }
    );
  };

  if (!currentQuestion) return null;

  const Icon = currentQuestion.icon;
  const progress = (timeLeft / 7) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        ref={popupRef}
        className={`w-[380px] p-5 rounded-3xl shadow-2xl transition-all duration-500 ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          border: `1px solid ${hexColor}30`,
          background: isDarkMode ? "#2D2D2D" : "#FFFFFF",
          boxShadow: isDarkMode
            ? "0 10px 25px rgba(0, 0, 0, 0.3)"
            : "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Timer Progress Bar */}
        <div className="absolute top-0 left-1/2 w-[95%] h-1 -translate-x-1/2 rounded-t-4xl overflow-hidden">
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              background: isPaused ? "#9CA3AF" : hexColor,
            }}
          />
        </div>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4"
          style={{ color: hexColor }}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl" style={{ background: hexColor }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: isDarkMode ? "#FFFFFF" : "#111827" }}
            >
              Quick Question
            </h3>
            <p
              className="text-sm"
              style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
            >
              Help us personalize
            </p>
          </div>
        </div>
        <p
          className="text-sm mb-4"
          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
        >
          {currentQuestion.question}
        </p>
        <div className="mb-4">
          {currentQuestion.type === "text" && (
            <div className="space-y-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
                  borderColor: isDarkMode ? "#555" : "#D1D5DB",
                  color: isDarkMode ? "#FFFFFF" : "#111827",
                }}
              />
              {currentQuestion.hasAutoDetect && (
                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="w-full px-3 py-2 text-sm rounded-lg text-white flex items-center justify-center"
                  style={{
                    background: locationLoading
                      ? isDarkMode
                        ? "#555"
                        : "#9CA3AF"
                      : hexColor,
                  }}
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  <span>
                    {locationLoading ? "Detecting..." : "Auto-Detect"}
                  </span>
                </button>
              )}
            </div>
          )}
          {currentQuestion.type === "number" && (
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              onWheel={(e) => e.target.blur()}
              placeholder={currentQuestion.placeholder}
              className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
                borderColor: isDarkMode ? "#555" : "#D1D5DB",
                color: isDarkMode ? "#FFFFFF" : "#111827",
                MozAppearance: "textfield",
              }}
            />
          )}
          {currentQuestion.type === "select" && (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
                borderColor: isDarkMode ? "#555" : "#D1D5DB",
                color: isDarkMode ? "#FFFFFF" : "#111827",
              }}
            >
              <option value="">Select an option</option>
              {currentQuestion.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {currentQuestion.type === "buttons" && (
            <div className="flex gap-2">
              {currentQuestion.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(opt)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-all"
                  style={
                    answer === opt
                      ? {
                          borderColor: hexColor,
                          background: hexColor,
                          color: "white",
                        }
                      : {
                          borderColor: `${hexColor}40`,
                          color: hexColor,
                          background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
                        }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {currentQuestion.type === "multi-select" && (
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleHobby(opt)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="py-2 px-2 text-xs rounded-lg border-2 transition-all"
                  style={
                    selectedHobbies?.includes(opt)
                      ? {
                          borderColor: hexColor,
                          background: hexColor,
                          color: "white",
                        }
                      : {
                          borderColor: `${hexColor}40`,
                          color: hexColor,
                          background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
                        }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-all"
            style={{
              borderColor: `${hexColor}40`,
              color: hexColor,
              background: isDarkMode ? "#3D3D3D" : "#FFFFFF",
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!isAnswerValid || saving}
            className="flex-1 py-2 px-3 text-sm rounded-lg flex items-center justify-center transition-all"
            style={
              isAnswerValid && !saving
                ? { background: hexColor, color: "white" }
                : {
                    background: isDarkMode ? "#555" : "#D1D5DB",
                    color: isDarkMode ? "#9CA3AF" : "#6B7280",
                  }
            }
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
