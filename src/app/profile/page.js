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
import { useColor } from "@/app/context/ColorContext";

const themeColors = [
  {
    name: "iCloud Blue",
    value: "bg-blue-300",
    border: "border-blue-300",
    hex: "#6EA8F7",
  },
  {
    name: "Lavender",
    value: "bg-purple-300",
    border: "border-purple-300",
    hex: "#B08EF5",
  },
  {
    name: "Mint",
    value: "bg-emerald-300",
    border: "border-emerald-300",
    hex: "#77D8A8",
  },
  {
    name: "Peach",
    value: "bg-orange-300",
    border: "border-orange-300",
    hex: "#F29C5B",
  },
  {
    name: "Rose Gold",
    value: "bg-rose-300",
    border: "border-rose-300",
    hex: "#EF8BAA",
  },
  {
    name: "Sky",
    value: "bg-sky-300",
    border: "border-sky-300",
    hex: "#82CCF7",
  },
  {
    name: "Pale Gold",
    value: "bg-yellow-200",
    border: "border-yellow-200",
    hex: "#F3D86B",
  },
  {
    name: "Aqua",
    value: "bg-cyan-300",
    border: "border-cyan-300",
    hex: "#72DADB",
  },
  {
    name: "Lavender Mist",
    value: "bg-violet-300",
    border: "border-violet-300",
    hex: "#A28BF2",
  },
  {
    name: "Soft Lime",
    value: "bg-lime-300",
    border: "border-lime-300",
    hex: "#B3E676",
  },
  {
    name: "Champagne",
    value: "bg-amber-200",
    border: "border-amber-200",
    hex: "#F3C369",
  },
  {
    name: "Silver",
    value: "bg-gray-200",
    border: "border-gray-200",
    hex: "#CFCFD3",
  },
  {
    name: "Graphite",
    value: "bg-slate-400",
    border: "border-slate-400",
    hex: "#7D8189",
  },
  {
    name: "Platinum",
    value: "bg-neutral-300",
    border: "border-neutral-300",
    hex: "#BFBFBF",
  },
  {
    name: "Warm Stone",
    value: "bg-stone-200",
    border: "border-stone-200",
    hex: "#D7D3CD",
  },
  {
    name: "Seafoam",
    value: "bg-teal-300",
    border: "border-teal-300",
    hex: "#6FD4C8",
  },
  {
    name: "Blush",
    value: "bg-pink-300",
    border: "border-pink-300",
    hex: "#EA93B8",
  },
  {
    name: "Ice Blue",
    value: "bg-sky-200",
    border: "border-sky-200",
    hex: "#A8D7FA",
  },
  {
    name: "Fog",
    value: "bg-gray-100",
    border: "border-gray-100",
    hex: "#E1E1E4",
  },
  {
    name: "Midnight",
    value: "bg-slate-500",
    border: "border-slate-500",
    hex: "#5E6168",
  },
];

const CircularProgress = ({ percentage, color, isDarkMode }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative w-40 h-40">
      <svg className="w-40 h-40 transform -rotate-90">
        <defs>
          <linearGradient
            id={`progressGradient-${color}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id={`shadow-${color}`}>
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor={color}
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={isDarkMode ? "#333" : "#f1f5f9"}
          strokeWidth="12"
          fill="none"
          opacity="0.3"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={`url(#progressGradient-${color})`}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`url(#shadow-${color})`}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.65, 0, 0.35, 1)",
          }}
        />
        <g opacity="0.6">
          <circle cx="80" cy={80 - radius} r="3" fill={color}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 80 80"
              to="360 80 80"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80" cy={80 - radius} r="3" fill={color}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="120 80 80"
              to="480 80 80"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80" cy={80 - radius} r="3" fill={color}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="240 80 80"
              to="600 80 80"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className="text-4xl font-bold"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              color: isDarkMode ? "#ffffff" : color,
            }}
          >
            {Math.round(percentage)}%
          </div>
          <div
            className="text-xs mt-1.5 font-medium tracking-wider uppercase"
            style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
          >
            Complete
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBar = ({ message, type, onClose, themeColor, isDarkMode }) => {
  if (!message) return null;
  const icons = {
    success: CheckCircle,
    error: AlertTriangle,
    info: AlertTriangle,
  };
  const Icon = icons[type] || AlertTriangle;
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center max-w-sm w-full animate-slide-down border border-white border-opacity-20"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(45, 45, 45, 0.6) 0%, rgba(30, 30, 30, 0.5) 100%)"
          : `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, ${themeColor}15 100%)`,
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow: isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      }}
    >
      <Icon
        className="w-4 h-4 mr-3"
        style={{ color: isDarkMode ? "#ffffff" : "#374151" }}
      />
      <span
        className="text-sm font-medium flex-grow"
        style={{
          letterSpacing: "-0.01em",
          color: isDarkMode ? "#ffffff" : "#111827",
        }}
      >
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-4 p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-all"
        style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default function ProfilePage() {
  const { updateColor, hexColor, isDarkMode } = useColor();
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
    gender: "",
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

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const showCustomMessage = useCallback((msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  }, []);

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
      profile.region,
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

  const handleUpdate = useCallback((field, value) => {
    setProfile((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "pets" && value === "No") newState.petType = "";
      return newState;
    });
    setHasChanges(true);
  }, []);

  useEffect(() => {
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
    loadUserData();
  }, [showCustomMessage]);

  const saveToDatabase = useCallback(async () => {
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
        gender: profile.gender || "",
        location: profile.location || "",
        pets: profile.pets || "",
        petType: profile.pets === "Yes" ? profile.petType : "",
        region: profile.region || "",
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update");
      updateColor(profile.themeColor.value);
      setHasChanges(false);
      showCustomMessage("Profile saved successfully!", "success");
    } catch (error) {
      showCustomMessage(`Failed to save: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }, [userDetails.userId, profile, updateColor, showCustomMessage]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showCustomMessage("Geolocation not supported", "error");
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
          handleUpdate("location", location);
          showCustomMessage("Location detected!", "info");
        } catch {
          const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          handleUpdate("location", location);
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
  }, [handleUpdate, showCustomMessage]);

  const toggleHobby = useCallback((hobby) => {
    setProfile((prev) => {
      const newHobbies = prev.hobbies.includes(hobby)
        ? prev.hobbies.filter((h) => h !== hobby)
        : [...prev.hobbies, hobby];
      return { ...prev, hobbies: newHobbies };
    });
    setHasChanges(true);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: isDarkMode ? "#1a1a1a" : "#ffffff" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: hexColor }}
          />
          <div
            className="text-base font-medium"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              letterSpacing: "-0.01em",
              color: isDarkMode ? "#d1d5db" : "#4b5563",
            }}
          >
            Loading profile...
          </div>
        </div>
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
        themeColor={profile.themeColor.hex}
        isDarkMode={isDarkMode}
      />
      <div
        className="min-h-screen py-12 px-4"
        style={{
          background: isDarkMode
            ? "linear-gradient(to bottom, #1a1a1a, #0a0a0a)"
            : "linear-gradient(to bottom, #f9fafb, #ffffff)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 mt-10">
            <h1
              className="text-5xl font-semibold mb-3"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: "-0.03em",
                color: isDarkMode ? "#ffffff" : "#111827",
              }}
            >
              Profile
            </h1>
            <p
              className="text-lg"
              style={{
                letterSpacing: "-0.01em",
                color: isDarkMode ? "#9ca3af" : "#6b7280",
              }}
            >
              Complete your profile for a personalized experience
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-full shadow-sm border"
                style={{
                  background: isDarkMode ? "#2d2d2d" : "#ffffff",
                  borderColor: isDarkMode ? "#444" : "#e5e7eb",
                }}
              >
                <User
                  className="w-3.5 h-3.5"
                  style={{ color: profile.themeColor.hex }}
                />
                <span
                  className="font-medium"
                  style={{
                    letterSpacing: "-0.01em",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                >
                  {userDetails.name}
                </span>
              </div>
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-full shadow-sm border"
                style={{
                  background: isDarkMode ? "#2d2d2d" : "#ffffff",
                  borderColor: isDarkMode ? "#444" : "#e5e7eb",
                }}
              >
                <Mail
                  className="w-3.5 h-3.5"
                  style={{ color: profile.themeColor.hex }}
                />
                <span
                  className=""
                  style={{
                    letterSpacing: "-0.01em",
                    color: isDarkMode ? "#9ca3af" : "#374151",
                  }}
                >
                  {userDetails.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-center mb-12">
            <CircularProgress
              percentage={completion}
              color={profile.themeColor.hex}
              isDarkMode={isDarkMode}
            />
          </div>
          <div
            className="rounded-3xl shadow-sm border p-8 space-y-8"
            style={{
              background: isDarkMode ? "#2d2d2d" : "#ffffff",
              borderColor: isDarkMode ? "#444" : "#e5e7eb",
              boxShadow: isDarkMode
                ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                : "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div>
              <label
                className="flex items-center text-sm font-medium mb-4"
                style={{
                  color: isDarkMode ? "#9ca3af" : "#374151",
                  letterSpacing: "-0.01em",
                }}
              >
                <Palette className="w-4 h-4 mr-2.5" />
                Color
              </label>
              <div className="flex flex-wrap gap-3">
                {themeColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleUpdate("themeColor", color)}
                    className={`w-11 h-11 rounded-full ${
                      color.value
                    } transition-all shadow-sm hover:shadow-md ${
                      profile.themeColor.name === color.name
                        ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                        : "hover:scale-105"
                    }`}
                    title={color.name}
                    style={{
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label
                className="flex items-center text-sm font-medium mb-2.5"
                style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
              >
                <User className="w-4 h-4 mr-2" />
                Gender
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Male", "Female", "Other", "Prefer not to say"].map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() => handleUpdate("gender", option)}
                      className="py-2.5 px-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={
                        profile.gender === option
                          ? {
                              color: profile.themeColor.hex,
                              backgroundColor: `${profile.themeColor.hex}20`,
                              border: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.1)"
                                : "1px solid rgba(255, 255, 255, 0.6)",
                            }
                          : {
                              background: isDarkMode ? "#3d3d3d" : "#f3f4f6",
                              color: isDarkMode ? "#ffffff" : "#111827",
                              border: isDarkMode
                                ? "1px solid #555"
                                : "1px solid #d1d5db",
                            }
                      }
                    >
                      {option}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="flex items-center text-sm font-medium mb-2.5"
                  style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleUpdate("age", e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Occupation
                </label>
                <select
                  value={profile.occupation}
                  onChange={(e) => handleUpdate("occupation", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                >
                  <option value="">Select your occupation</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Business">Business</option>
                  <option value="Technical/IT">Technical/IT</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                  <option value="Creative/Arts">Creative/Arts</option>
                  <option value="Sales/Marketing">Sales/Marketing</option>
                  <option value="Government">Government</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <select
                  value={profile.region}
                  onChange={(e) => handleUpdate("region", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                >
                  <option value="">Select your region</option>
                  <option value="Semi-Rural">Semi Rural</option>
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              <div>
                <label
                  className="flex items-center text-sm font-medium mb-2.5"
                  style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favorite Brand
                </label>
                <input
                  type="text"
                  value={profile.brand}
                  onChange={(e) => handleUpdate("brand", e.target.value)}
                  placeholder="e.g., Apple, Nike"
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>
              <div>
                <label
                  className="flex items-center text-sm font-medium mb-2.5"
                  style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                >
                  <Car className="w-4 h-4 mr-2" />
                  Travel Mode
                </label>
                <select
                  value={profile.travelMode}
                  onChange={(e) => handleUpdate("travelMode", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all cursor-pointer"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = isDarkMode
                        ? "#555"
                        : "#d1d5db";
                    }
                  }}
                >
                  <option value="">Select mode</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Public Transport">Public Transport</option>
                  <option value="Walking">Walking</option>
                  <option value="Multiple">Multiple</option>
                </select>
              </div>
              <div>
                <label
                  className="flex items-center text-sm font-medium mb-2.5"
                  style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Price Range
                </label>
                <select
                  value={profile.priceRange}
                  onChange={(e) => handleUpdate("priceRange", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all cursor-pointer"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode
                      ? "#555"
                      : "#d1d5db";
                    e.target.style.boxShadow = "";
                  }}
                >
                  <option value="">Select range</option>
                  <option value="Under $50">Under $50</option>
                  <option value="$50 - $100">$50 - $100</option>
                  <option value="$100 - $250">$100 - $250</option>
                  <option value="$250 - $500">$250 - $500</option>
                  <option value="$500 - $1000">$500 - $1000</option>
                  <option value="Above $1000">Above $1000</option>
                </select>
              </div>
            </div>
            <div>
              <label
                className="flex items-center text-sm font-medium mb-3"
                style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
              >
                <Home className="w-4 h-4 mr-2" />
                Living Status
              </label>
              <div className="flex gap-3">
                {["Bachelor", "Family"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdate("livingStatus", status)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all`}
                    style={
                      profile.livingStatus === status
                        ? {
                            color: profile.themeColor.hex,
                            backgroundColor: `${profile.themeColor.hex}20`,
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(255, 255, 255, 0.6)",
                          }
                        : {
                            background: isDarkMode ? "#3d3d3d" : "#f3f4f6",
                            color: isDarkMode ? "#ffffff" : "#111827",
                            border: isDarkMode
                              ? "1px solid #555"
                              : "1px solid #d1d5db",
                          }
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="text-sm font-medium mb-3 block"
                  style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                >
                  Pets
                </label>
                <div className="flex gap-3">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleUpdate("pets", option)}
                      className={`flex-1 py-3 rounded-xl font-medium`}
                      style={
                        profile.pets === option
                          ? {
                              color: profile.themeColor.hex,
                              backgroundColor: `${profile.themeColor.hex}20`,
                              border: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.1)"
                                : "1px solid rgba(255, 255, 255, 0.6)",
                            }
                          : {
                              background: isDarkMode ? "#3d3d3d" : "#f3f4f6",
                              color: isDarkMode ? "#ffffff" : "#111827",
                              border: isDarkMode
                                ? "1px solid #555"
                                : "1px solid #d1d5db",
                            }
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              {profile.pets === "Yes" && (
                <div>
                  <label
                    className="text-sm font-medium mb-3 block"
                    style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
                  >
                    Pet Type
                  </label>
                  <select
                    value={profile.petType}
                    onChange={(e) => handleUpdate("petType", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all cursor-pointer"
                    style={{
                      background: isDarkMode ? "#3d3d3d" : "#ffffff",
                      borderColor: isDarkMode ? "#555" : "#d1d5db",
                      color: isDarkMode ? "#ffffff" : "#111827",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = profile.themeColor.hex;
                      e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDarkMode
                        ? "#555"
                        : "#d1d5db";
                      e.target.style.boxShadow = "";
                    }}
                  >
                    <option value="">Select type</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Hamster">Hamster</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label
                className="flex items-center text-sm font-medium mb-3"
                style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
              >
                <Heart className="w-4 h-4 mr-2" />
                Hobbies
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium`}
                    style={
                      profile.hobbies.includes(hobby)
                        ? {
                            color: profile.themeColor.hex,
                            backgroundColor: `${profile.themeColor.hex}20`,
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(255, 255, 255, 0.6)",
                          }
                        : {
                            background: isDarkMode ? "#3d3d3d" : "#f3f4f6",
                            color: isDarkMode ? "#ffffff" : "#111827",
                            border: isDarkMode
                              ? "1px solid #555"
                              : "1px solid #d1d5db",
                          }
                    }
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="flex items-center text-sm font-medium mb-3"
                style={{ color: isDarkMode ? "#9ca3af" : "#374151" }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleUpdate("location", e.target.value)}
                  placeholder="Enter your location"
                  className="flex-1 px-4 py-3 rounded-xl border focus:outline-none"
                  style={{
                    background: isDarkMode ? "#3d3d3d" : "#ffffff",
                    borderColor: isDarkMode ? "#555" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  }}
                />
                <button
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="px-6 py-3 rounded-xl font-medium flex items-center justify-center"
                  style={{
                    color: profile.themeColor.hex,
                    backgroundColor: `${profile.themeColor.hex}20`,
                  }}
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  {locationLoading ? "Detecting..." : "Auto-Detect"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <button
              onClick={saveToDatabase}
              disabled={!hasChanges || saving}
              className={`px-12 py-4 rounded-full font-medium text-base transition-all flex items-center justify-center shadow-sm`}
              style={{
                letterSpacing: "-0.01em",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                ...(hasChanges && !saving
                  ? {
                      color: profile.themeColor.hex,
                      backgroundColor: `${profile.themeColor.hex}20`,
                      border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(255, 255, 255, 0.6)",
                    }
                  : {
                      background: isDarkMode ? "#3d3d3d" : "#e5e7eb",
                      color: isDarkMode ? "#6b7280" : "#9ca3af",
                      border: isDarkMode
                        ? "1px solid #555"
                        : "1px solid #d1d5db",
                    }),
              }}
              onMouseEnter={(e) => {
                if (hasChanges && !saving)
                  e.target.style.backgroundColor = `${profile.themeColor.hex}40`;
              }}
              onMouseLeave={(e) => {
                if (hasChanges && !saving)
                  e.target.style.backgroundColor = `${profile.themeColor.hex}20`;
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                "Save Changes"
              ) : (
                "No Changes"
              )}
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
          animation: slide-down 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </>
  );
}
