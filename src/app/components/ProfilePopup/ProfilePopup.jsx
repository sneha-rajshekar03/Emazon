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
  isAnswerValid,
  toggleHobby,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { hexColor } = useColor();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentQuestion) return;

    const showTimer = setTimeout(() => setIsVisible(true), 100);
    timerRef.current = setTimeout(handleClose, 5000);

    return () => {
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentQuestion, handleClose]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const detectLocation = async () => {
    clearTimer();
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`w-[380px] p-5 bg-white rounded-3xl shadow-2xl transition-all duration-500 ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
        onClick={clearTimer}
        style={{ border: `1px solid ${hexColor}30` }}
      >
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
            <h3 className="text-lg font-semibold">Quick Question</h3>
            <p className="text-sm text-gray-500">Help us personalize</p>
          </div>
        </div>

        <p className="text-sm mb-4">{currentQuestion.question}</p>

        <div className="mb-4">
          {currentQuestion.type === "text" && (
            <div className="space-y-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border"
              />
              {currentQuestion.hasAutoDetect && (
                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="w-full px-3 py-2 text-sm rounded-lg text-white"
                  style={{ background: locationLoading ? "#9CA3AF" : hexColor }}
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    <MapPin className="w-4 h-4 inline" />
                  )}
                  <span className="ml-2">
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
              placeholder={currentQuestion.placeholder}
              className="w-full px-3 py-2 text-sm rounded-lg border"
            />
          )}

          {currentQuestion.type === "select" && (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border"
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
                  className="flex-1 py-2 px-3 text-sm rounded-lg border-2"
                  style={
                    answer === opt
                      ? {
                          borderColor: hexColor,
                          background: hexColor,
                          color: "white",
                        }
                      : { borderColor: `${hexColor}40`, color: hexColor }
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
                  className="py-2 px-2 text-xs rounded-lg border-2"
                  style={
                    selectedHobbies?.includes(opt)
                      ? {
                          borderColor: hexColor,
                          background: hexColor,
                          color: "white",
                        }
                      : { borderColor: `${hexColor}40`, color: hexColor }
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
            className="flex-1 py-2 px-3 text-sm rounded-lg border-2"
            style={{ borderColor: `${hexColor}40`, color: hexColor }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!isAnswerValid}
            className="flex-1 py-2 px-3 text-sm rounded-lg"
            style={
              isAnswerValid
                ? { background: hexColor, color: "white" }
                : { background: "#D1D5DB", color: "#6B7280" }
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
