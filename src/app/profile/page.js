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
import { useColor } from "@app/context/ColorContext";

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

const CircularProgress = ({ percentage, color }) => {
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
          stroke="#f1f5f9"
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
              color,
            }}
          >
            {Math.round(percentage)}%
          </div>
          <div className="text-xs text-gray-500 mt-1.5 font-medium tracking-wider uppercase">
            Complete
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBar = ({ message, type, onClose, themeColor }) => {
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
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, ${themeColor}15 100%)`,
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      }}
    >
      <Icon className="w-4 h-4 mr-3 text-gray-800" />
      <span
        className="text-sm font-medium flex-grow text-gray-900"
        style={{ letterSpacing: "-0.01em" }}
      >
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-4 p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-all"
      >
        <X className="w-3.5 h-3.5 text-gray-700" />
      </button>
    </div>
  );
};

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
  const { updateColor } = useColor();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Auto-hide message after 4 seconds
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

  const handleUpdate = useCallback((field, value) => {
    setProfile((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "pets" && value === "No") newState.petType = "";
      return newState;
    });
    setHasChanges(true);
  }, []);

  // Load user data on mount
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-gray-900" />
        <div
          className="text-lg text-gray-600 ml-3"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            letterSpacing: "-0.01em",
          }}
        >
          Loading profile...
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
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10 mt-10">
            <h1
              className="text-5xl font-semibold text-gray-900 mb-3"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: "-0.03em",
              }}
            >
              Profile
            </h1>
            <p
              className="text-gray-600 text-lg"
              style={{ letterSpacing: "-0.01em" }}
            >
              Complete your profile for a personalized experience
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <User
                  className="w-3.5 h-3.5"
                  style={{ color: profile.themeColor.hex }}
                />
                <span
                  className="font-medium text-gray-900"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {userDetails.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <Mail
                  className="w-3.5 h-3.5"
                  style={{ color: profile.themeColor.hex }}
                />
                <span
                  className="text-gray-700"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {userDetails.email}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Circle */}
          <div className="flex justify-center mb-12">
            <CircularProgress
              percentage={completion}
              color={profile.themeColor.hex}
            />
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 space-y-8">
            {/* Theme Color Selector */}
            <div>
              <label
                className="flex items-center text-sm font-medium text-gray-700 mb-4"
                style={{ letterSpacing: "-0.01em" }}
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
            {/* Form Fields - Add this after the Theme Color Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <User className="w-4 h-4 mr-2" />
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleUpdate("age", e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Occupation
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleUpdate("age", e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />{" "}
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorite Brand
                </label>
                <input
                  type="text"
                  value={profile.brand}
                  onChange={(e) => handleUpdate("brand", e.target.value)}
                  placeholder="e.g., Apple, Nike"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                />{" "}
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <Car className="w-4 h-4 mr-2" />
                  Travel Mode
                </label>
                <select
                  value={profile.travelMode}
                  onChange={(e) => handleUpdate("travelMode", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all cursor-pointer"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = "";
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
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Price Range
                </label>
                <select
                  value={profile.priceRange}
                  onChange={(e) => handleUpdate("priceRange", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all cursor-pointer"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
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
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2.5">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Mode
                </label>
                <select
                  value={profile.paymentMode}
                  onChange={(e) => handleUpdate("paymentMode", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all cursor-pointer"
                  style={{
                    "--theme-color": profile.themeColor.hex,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = profile.themeColor.hex;
                    e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "";
                    e.target.style.boxShadow = "";
                  }}
                >
                  <option value="">Select mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Digital Wallet">Digital Wallet</option>
                </select>
              </div>{" "}
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <Home className="w-4 h-4 mr-2" />
                Living Status
              </label>
              <div className="flex gap-3">
                {["Bachelor", "Family"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdate("livingStatus", status)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      profile.livingStatus === status
                        ? "shadow-sm"
                        : "bg-gray-100"
                    }`}
                    style={
                      profile.livingStatus === status
                        ? {
                            color: profile.themeColor.hex,
                            backgroundColor: `${profile.themeColor.hex}20`,
                          }
                        : {}
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Pets
                </label>
                <div className="flex gap-3">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleUpdate("pets", option)}
                      className={`flex-1 py-3 rounded-xl font-medium ${
                        profile.pets === option ? "shadow-sm" : "bg-gray-100"
                      }`}
                      style={
                        profile.pets === option
                          ? {
                              color: profile.themeColor.hex,
                              backgroundColor: `${profile.themeColor.hex}20`,
                            }
                          : {}
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {profile.pets === "Yes" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Pet Type
                  </label>
                  <select
                    value={profile.petType}
                    onChange={(e) => handleUpdate("petType", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none transition-all cursor-pointer"
                    style={{
                      "--theme-color": profile.themeColor.hex,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = profile.themeColor.hex;
                      e.target.style.boxShadow = `0 0 0 3px ${profile.themeColor.hex}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
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
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
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
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium ${
                      profile.hobbies.includes(hobby)
                        ? "shadow-sm"
                        : "bg-gray-100"
                    }`}
                    style={
                      profile.hobbies.includes(hobby)
                        ? {
                            color: profile.themeColor.hex,
                            backgroundColor: `${profile.themeColor.hex}20`,
                          }
                        : {}
                    }
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleUpdate("location", e.target.value)}
                  placeholder="Enter your location"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none"
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
            </div>{" "}
          </div>

          {/* Save Button */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={saveToDatabase}
              disabled={!hasChanges || saving}
              className={`px-12 py-4 rounded-full font-medium text-base transition-all flex items-center justify-center shadow-sm ${
                hasChanges && !saving
                  ? "transform hover:scale-105"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{
                letterSpacing: "-0.01em",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                ...(hasChanges && !saving
                  ? {
                      color: profile.themeColor.hex,
                      backgroundColor: `${profile.themeColor.hex}20`,
                    }
                  : {}),
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
              {saving && <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />}
              {saving
                ? "Saving..."
                : hasChanges
                ? "Save Changes"
                : "No Changes"}
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
