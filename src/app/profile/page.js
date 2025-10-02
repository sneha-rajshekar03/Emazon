"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  MapPin,
  Briefcase,
  Car,
  Home,
  Heart,
  CreditCard,
  DollarSign,
  Palette,
  Mail,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// Constants
const POPUP_INTERVAL_MS = 5000;
const POPUP_INITIAL_DELAY_MS = 1000;

const themeColors = [
  { name: "Blue", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Purple", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Green", value: "bg-green-500", border: "border-green-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
  { name: "Pink", value: "bg-pink-500", border: "border-pink-500" },
];

const profileQuestions = [
  {
    field: "age",
    question: "How old are you?",
    type: "number",
    icon: User,
    placeholder: "Enter your age",
  },
  {
    field: "brand",
    question: "What's your favorite brand?",
    type: "text",
    icon: Heart,
    placeholder: "e.g., Nike, Apple",
  },
  {
    field: "priceRange",
    question: "What's your typical spending range?",
    type: "select",
    icon: DollarSign,
    options: [
      "Under $50",
      "$50 - $100",
      "$100 - $250",
      "$250 - $500",
      "$500 - $1000",
      "Above $1000",
    ],
  },
  {
    field: "occupation",
    question: "What do you do for a living?",
    type: "text",
    icon: Briefcase,
    placeholder: "Enter your occupation",
  },
  {
    field: "travelMode",
    question: "How do you usually get around?",
    type: "select",
    icon: Car,
    options: ["Car", "Bike", "Public Transport", "Walking", "Multiple"],
  },
  {
    field: "livingStatus",
    question: "What's your living situation?",
    type: "buttons",
    icon: Home,
    options: ["Bachelor", "Family"],
  },
  {
    field: "hobbies",
    question: "What are your hobbies?",
    type: "multi-select",
    icon: Heart,
    options: [
      "Reading",
      "Gaming",
      "Traveling",
      "Cooking",
      "Sports",
      "Music",
      "Photography",
      "Art",
    ],
  },
  {
    field: "location",
    question: "Where are you located?",
    type: "text",
    icon: MapPin,
    placeholder: "Enter your city/location",
    hasAutoDetect: true,
  },
  {
    field: "pets",
    question: "Do you have any pets?",
    type: "buttons",
    icon: Heart,
    options: ["Yes", "No"],
  },
  {
    field: "petType",
    question: "What type of pet do you have?",
    type: "select",
    icon: Heart,
    options: [
      "Dog",
      "Cat",
      "Bird",
      "Fish",
      "Rabbit",
      "Hamster",
      "Reptile",
      "Other",
    ],
    condition: (p) => p.pets === "Yes",
  },
  {
    field: "paymentMode",
    question: "How do you prefer to pay?",
    type: "select",
    icon: CreditCard,
    options: ["Cash", "Credit Card", "Debit Card", "UPI", "Digital Wallet"],
  },
];

// Components
const CircularProgress = ({ percentage, color }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800">
            {Math.round(percentage)}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
    </div>
  );
};

const MessageBar = ({ message, type, onClose }) => {
  if (!message) return null;
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };
  const icons = {
    success: CheckCircle,
    error: AlertTriangle,
    info: AlertTriangle,
  };
  const Icon = icons[type] || AlertTriangle;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] p-4 rounded-xl shadow-2xl text-white flex items-center max-w-md w-full ${
        colors[type] || "bg-gray-500"
      } animate-slide-down`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="text-sm font-medium flex-grow">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ProfilePopup = ({
  profile,
  currentQuestion,
  answer,
  setAnswer,
  selectedHobbies,
  locationLoading,
  getLocation,
  handleClose,
  handleSave,
  saving,
  isAnswerValid,
  toggleHobby,
}) => {
  if (!currentQuestion) return null;
  const Icon = currentQuestion.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-4">
          <div className={`${profile.themeColor.value} p-4 rounded-full`}>
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
            <div>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                autoFocus
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
              {currentQuestion.hasAutoDetect && (
                <button
                  onClick={getLocation}
                  disabled={locationLoading}
                  className={`mt-2 w-full py-2 rounded-lg ${profile.themeColor.value} text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center`}
                >
                  {locationLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5 mr-2" />
                  )}
                  {locationLoading ? "Detecting..." : "Auto-Detect Location"}
                </button>
              )}
            </div>
          )}

          {currentQuestion.type === "number" && (
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
              placeholder={currentQuestion.placeholder}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          )}

          {currentQuestion.type === "select" && (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an option</option>
              {currentQuestion.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {currentQuestion.type === "buttons" && (
            <div className="flex gap-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(opt)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                    answer === opt
                      ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multi-select" && (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleHobby(opt)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                    selectedHobbies.includes(opt)
                      ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!isAnswerValid || saving}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center ${
              isAnswerValid && !saving
                ? `${profile.themeColor.value} text-white hover:opacity-90`
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
    </div>
  );
};

// Main Component
export default function ProfilePage() {
  const [userDetails, setUserDetails] = useState({
    userId: "",
    email: "",
    name: "",
  });
  const [profile, setProfile] = useState({
    userId: "",
    themeColor: themeColors[0],
    age: "",
    brand: "",
    priceRange: "",
    occupation: "",
    travelMode: "",
    livingStatus: "",
    hobbies: [],
    location: "",
    pets: "",
    petType: "",
    paymentMode: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showCustomMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const calculateCompletion = useCallback(() => {
    const fields = [
      profile.age,
      profile.brand,
      profile.priceRange,
      profile.occupation,
      profile.travelMode,
      profile.livingStatus,
      profile.location,
      profile.pets,
      profile.paymentMode,
    ];
    const filledFields = fields.filter((f) => f && f !== "").length;
    const hobbiesScore = profile.hobbies.length > 0 ? 1 : 0;
    const petTypeScore = profile.pets === "Yes" && profile.petType ? 1 : 0;
    const totalFields = fields.length + 1 + (profile.pets === "Yes" ? 1 : 0);
    const totalFilled = filledFields + hobbiesScore + petTypeScore;
    return totalFields === 0
      ? 0
      : Math.round((totalFilled / totalFields) * 100);
  }, [profile]);

  const showNextQuestion = useCallback(() => {
    if (showPopup) return;
    const unanswered = profileQuestions.filter((q) => {
      if (q.condition && !q.condition(profile)) return false;
      const value = profile[q.field];
      const isEmpty = Array.isArray(value)
        ? value.length === 0
        : !value || value.toString().trim() === "";
      return isEmpty && !askedQuestions.includes(q.field);
    });
    if (unanswered.length > 0) {
      const randomQuestion =
        unanswered[Math.floor(Math.random() * unanswered.length)];
      setCurrentQuestion(randomQuestion);
      setSelectedHobbies(
        randomQuestion.type === "multi-select" ? profile.hobbies || [] : []
      );
      setAnswer(
        randomQuestion.type === "multi-select"
          ? ""
          : profile[randomQuestion.field] || ""
      );
      setShowPopup(true);
    }
  }, [profile, askedQuestions, showPopup]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (loading || window.location.pathname.toLowerCase().includes("/profile"))
      return;
    const initialTimeout = setTimeout(showNextQuestion, POPUP_INITIAL_DELAY_MS);
    const intervalTimer = setInterval(showNextQuestion, POPUP_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalTimer);
    };
  }, [loading, showNextQuestion]);

  const handlePopupClose = () => {
    if (currentQuestion)
      setAskedQuestions((prev) => [...prev, currentQuestion.field]);
    setShowPopup(false);
    setCurrentQuestion(null);
    setAnswer("");
    setSelectedHobbies([]);
  };

  const handlePopupSave = async () => {
    if (!currentQuestion) return;
    setSaving(true);
    try {
      let valueToSave =
        currentQuestion.type === "multi-select" ? selectedHobbies : answer;
      if (currentQuestion.type === "number") {
        valueToSave = parseInt(valueToSave, 10);
        if (isNaN(valueToSave) || valueToSave <= 0) valueToSave = "";
      }
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          [currentQuestion.field]: valueToSave,
          themeColor: profile.themeColor,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to save");
      setProfile((prev) => ({
        ...prev,
        [currentQuestion.field]: valueToSave,
        ...(currentQuestion.field === "pets" && valueToSave === "No"
          ? { petType: "" }
          : {}),
      }));
      setAskedQuestions((prev) => [...prev, currentQuestion.field]);
      showCustomMessage(`Saved your answer!`, "success");
      setTimeout(handlePopupClose, 500);
    } catch (error) {
      showCustomMessage(`Error: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePopupHobby = (hobby) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const isAnswerValid = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "multi-select")
      return selectedHobbies.length > 0;
    if (currentQuestion.type === "number") {
      const num = parseInt(answer, 10);
      return !isNaN(num) && num > 0;
    }
    return answer && answer.toString().trim() !== "";
  };

  const handleUpdate = (field, value) => {
    setProfile((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "pets" && value === "No") newState.petType = "";
      setHasChanges(true);
      return newState;
    });
  };

  const loadUserData = async () => {
    try {
      const userRes = await fetch("/api/users");
      if (!userRes.ok) throw new Error("Failed to fetch user");
      const userData = await userRes.json();
      const userId =
        userData.user.id ||
        userData.user._id?.toString() ||
        userData.user._id?.$oid;
      setUserDetails({
        userId,
        email: userData.user.email || "No Email",
        name: userData.user.name || userData.user.username || "User",
      });

      const profileRes = await fetch(`/api/profile?userId=${userId}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const themeColor =
          themeColors.find(
            (tc) => tc.name === profileData.data.themeColor?.name
          ) || themeColors[0];
        setProfile((prev) => ({
          ...prev,
          ...profileData.data,
          userId,
          themeColor,
          hobbies: profileData.data.hobbies || [],
        }));
      } else {
        setProfile((prev) => ({ ...prev, userId }));
      }
    } catch (error) {
      showCustomMessage(`Failed to load: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    setSaving(true);
    try {
      const profileData = {
        userId: userDetails.userId,
        themeColor: {
          name: profile.themeColor.name,
          value: profile.themeColor.value,
          border: profile.themeColor.border,
        },
        age: profile.age ? parseInt(profile.age, 10) : "",
        brand: profile.brand || "",
        priceRange: profile.priceRange || "",
        occupation: profile.occupation || "",
        travelMode: profile.travelMode || "",
        livingStatus: profile.livingStatus || "",
        hobbies: profile.hobbies || [],
        location: profile.location || "",
        pets: profile.pets || "",
        petType: profile.pets === "Yes" ? profile.petType : "",
        paymentMode: profile.paymentMode || "",
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update");
      setHasChanges(false);
      showCustomMessage("Profile saved successfully!", "success");
    } catch (error) {
      showCustomMessage(`Failed to save: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const location = `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
            showPopup
              ? setAnswer(location)
              : handleUpdate("location", location);
            showCustomMessage("Location detected!", "info");
          } catch {
            const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            showPopup
              ? setAnswer(location)
              : handleUpdate("location", location);
            showCustomMessage("Using coordinates", "info");
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          setLocationLoading(false);
          showCustomMessage("Unable to get location", "error");
        }
      );
    } else {
      setLocationLoading(false);
      showCustomMessage("Geolocation not supported", "error");
    }
  };

  const toggleHobby = (hobby) => {
    const newHobbies = profile.hobbies.includes(hobby)
      ? profile.hobbies.filter((h) => h !== hobby)
      : [...profile.hobbies, hobby];
    handleUpdate("hobbies", newHobbies);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-xl text-gray-600 ml-3">Loading profile...</div>
      </div>
    );
  }

  const completion = calculateCompletion();

  return (
    <>
      <MessageBar
        message={message}
        type={messageType}
        onClose={() => setMessage(null)}
      />
      {showPopup && (
        <ProfilePopup
          profile={profile}
          currentQuestion={currentQuestion}
          answer={answer}
          setAnswer={setAnswer}
          selectedHobbies={selectedHobbies}
          locationLoading={locationLoading}
          getLocation={getLocation}
          handleClose={handlePopupClose}
          handleSave={handlePopupSave}
          saving={saving}
          isAnswerValid={isAnswerValid()}
          toggleHobby={togglePopupHobby}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Complete your profile for personalized recommendations
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{userDetails.name}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>{userDetails.email}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-10">
            <CircularProgress
              percentage={completion}
              color={profile.themeColor.value.replace("bg-", "text-")}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Palette className="w-5 h-5 mr-2" />
                Profile Theme
              </label>
              <div className="flex gap-3">
                {themeColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleUpdate("themeColor", color)}
                    className={`w-12 h-12 rounded-full ${
                      color.value
                    } transition-all shadow-md ${
                      profile.themeColor.name === color.name
                        ? "ring-4 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleUpdate("age", e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Occupation
                </label>
                <input
                  type="text"
                  value={profile.occupation}
                  onChange={(e) => handleUpdate("occupation", e.target.value)}
                  placeholder="Your occupation"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorite Brand
                </label>
                <input
                  type="text"
                  value={profile.brand}
                  onChange={(e) => handleUpdate("brand", e.target.value)}
                  placeholder="e.g., Nike, Apple"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Car className="w-4 h-4 mr-2" />
                  Travel Mode
                </label>
                <select
                  value={profile.travelMode}
                  onChange={(e) => handleUpdate("travelMode", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select mode</option>
                  {[
                    "Car",
                    "Bike",
                    "Public Transport",
                    "Walking",
                    "Multiple",
                  ].map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Price Range
                </label>
                <select
                  value={profile.priceRange}
                  onChange={(e) => handleUpdate("priceRange", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select range</option>
                  {[
                    "Under $50",
                    "$50 - $100",
                    "$100 - $250",
                    "$250 - $500",
                    "$500 - $1000",
                    "Above $1000",
                  ].map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Mode
                </label>
                <select
                  value={profile.paymentMode}
                  onChange={(e) => handleUpdate("paymentMode", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select mode</option>
                  {[
                    "Cash",
                    "Credit Card",
                    "Debit Card",
                    "UPI",
                    "Digital Wallet",
                  ].map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Home className="w-4 h-4 mr-2" />
                Living Status
              </label>
              <div className="flex gap-3">
                {["Bachelor", "Family"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdate("livingStatus", status)}
                    className={`flex-1 py-2.5 rounded-lg border-2 font-semibold transition-all ${
                      profile.livingStatus === status
                        ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Pets
                </label>
                <div className="flex gap-3">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleUpdate("pets", option)}
                      className={`flex-1 py-2.5 rounded-lg border-2 font-semibold transition-all ${
                        profile.pets === option
                          ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {profile.pets === "Yes" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Pet Type
                  </label>
                  <select
                    value={profile.petType}
                    onChange={(e) => handleUpdate("petType", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select type</option>
                    {[
                      "Dog",
                      "Cat",
                      "Bird",
                      "Fish",
                      "Rabbit",
                      "Hamster",
                      "Reptile",
                      "Other",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Heart className="w-4 h-4 mr-2" />
                Hobbies
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "Reading",
                  "Gaming",
                  "Traveling",
                  "Cooking",
                  "Sports",
                  "Music",
                  "Photography",
                  "Art",
                ].map((hobby) => (
                  <button
                    key={hobby}
                    onClick={() => toggleHobby(hobby)}
                    className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      profile.hobbies.includes(hobby)
                        ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleUpdate("location", e.target.value)}
                  placeholder="Enter your location"
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={getLocation}
                  disabled={locationLoading}
                  className={`px-6 py-2.5 rounded-lg ${profile.themeColor.value} text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center whitespace-nowrap`}
                >
                  {locationLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5 mr-2" />
                  )}
                  {locationLoading ? "Detecting..." : "Auto-Detect"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={saveToDatabase}
              disabled={!hasChanges || saving}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center shadow-lg ${
                hasChanges && !saving
                  ? `${profile.themeColor.value} text-white hover:opacity-90 hover:shadow-xl transform hover:scale-105`
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {saving && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
              {saving
                ? "Saving..."
                : hasChanges
                ? "Save Profile Changes"
                : "No Changes to Save"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
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
    </>
  );
}
