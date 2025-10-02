"use client";
import React from "react";
import { X, MapPin, Loader2 } from "lucide-react";

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
  showCustomMessage,
}) => {
  if (!currentQuestion) return null;
  const Icon = currentQuestion.icon;

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          const location = `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
          setAnswer(location);
          if (showCustomMessage) {
            showCustomMessage("Location detected!", "info");
          }
        } catch (error) {
          const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAnswer(location);
          if (showCustomMessage) {
            showCustomMessage("Using coordinates", "info");
          }
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
        alert("Unable to get location. Please check your browser permissions.");
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-4">
          <div
            className={`${
              profile.themeColor?.value || "bg-blue-500"
            } p-4 rounded-full`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Quick Question!
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {currentQuestion.question}
        </p>

        <div className="mb-6">
          {currentQuestion.type === "text" && (
            <div className="space-y-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus
              />
              {currentQuestion.hasAutoDetect && (
                <button
                  onClick={handleAutoDetectLocation}
                  disabled={locationLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                    locationLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : `${
                          profile.themeColor?.value || "bg-blue-500"
                        } hover:opacity-90`
                  } text-white shadow-sm`}
                >
                  {locationLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                  <span>
                    {locationLoading ? "Detecting..." : "Auto-Detect Location"}
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
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              autoFocus
            />
          )}

          {currentQuestion.type === "select" && (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select an option</option>
              {currentQuestion.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {currentQuestion.type === "buttons" && (
            <div className="flex gap-3">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswer(option)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-semibold shadow-sm ${
                    answer === option
                      ? `${profile.themeColor?.border || "border-blue-500"} ${
                          profile.themeColor?.value || "bg-blue-500"
                        } text-white scale-[1.02] shadow-md`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multi-select" && (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleHobby(option)}
                  className={`py-2 px-3 rounded-lg border-2 transition-all text-sm shadow-sm ${
                    selectedHobbies?.includes(option)
                      ? `${profile.themeColor?.border || "border-blue-500"} ${
                          profile.themeColor?.value || "bg-blue-500"
                        } text-white`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!isAnswerValid || saving}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${
              isAnswerValid && !saving
                ? `${
                    profile.themeColor?.value || "bg-blue-500"
                  } text-white hover:opacity-90 shadow-sm`
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Helping us personalize your experience
        </p>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
