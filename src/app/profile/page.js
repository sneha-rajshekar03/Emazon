"use client";
import React, { useState, useEffect } from "react";
import {
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
} from "lucide-react";

const themeColors = [
  { name: "Blue", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Purple", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Green", value: "bg-green-500", border: "border-green-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
  { name: "Pink", value: "bg-pink-500", border: "border-pink-500" },
];

const hobbiesOptions = [
  "Reading",
  "Gaming",
  "Traveling",
  "Cooking",
  "Sports",
  "Music",
  "Photography",
  "Art",
];
const travelModes = ["Car", "Bike", "Public Transport", "Walking", "Multiple"];
const priceRanges = [
  "Under $50",
  "$50 - $100",
  "$100 - $250",
  "$250 - $500",
  "$500 - $1000",
  "Above $1000",
];
const petTypes = [
  "Dog",
  "Cat",
  "Bird",
  "Fish",
  "Rabbit",
  "Hamster",
  "Reptile",
  "Other",
];
const paymentModes = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Digital Wallet",
];

// API Helper Functions
const fetchUserDetails = async () => {
  const res = await fetch("/api/users");
  if (!res.ok) {
    throw new Error("Failed to fetch user details");
  }
  const data = await res.json();
  return data.user; // Should return { email, name, id, color }
};

const fetchProfile = async (userId) => {
  const res = await fetch(`/api/profile?userId=${userId}`);
  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to fetch profile");
  }
  if (res.status === 404) {
    return null;
  }
  const data = await res.json();
  return data.data;
};
const handleUpdate = (field, value) => {
  setProfile((prev) => ({
    ...prev,
    [field]: value,
  }));
  setHasChanges(true);
};

const calculateCompletion = () => {
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

  const filledFields = fields.filter((field) => field && field !== "").length;
  const hobbiesScore = profile.hobbies.length > 0 ? 1 : 0;
  const petTypeScore = profile.pets === "Yes" && profile.petType ? 1 : 0;

  const totalFields = fields.length + 1 + (profile.pets === "Yes" ? 1 : 0);
  const totalFilled = filledFields + hobbiesScore + petTypeScore;

  return Math.round((totalFilled / totalFields) * 100);
};
const updateProfile = async (profileData) => {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to update profile");
  }
  return data.data;
};

const CircularProgress = ({ percentage, color }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg className="transform -rotate-90 w-48 h-48">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color || "text-blue-500"}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">
            {Math.round(percentage)}%
          </div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const [userDetails, setUserDetails] = useState({
    userId: "",
    email: "",
    name: "",
    color: "",
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

  useEffect(() => {
    loadUserData();
  }, []);

  // MOVE handleUpdate INSIDE the component
  const handleUpdate = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  // MOVE calculateCompletion INSIDE the component
  const calculateCompletion = () => {
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

    const filledFields = fields.filter((field) => field && field !== "").length;
    const hobbiesScore = profile.hobbies.length > 0 ? 1 : 0;
    const petTypeScore = profile.pets === "Yes" && profile.petType ? 1 : 0;

    const totalFields = fields.length + 1 + (profile.pets === "Yes" ? 1 : 0);
    const totalFilled = filledFields + hobbiesScore + petTypeScore;

    return Math.round((totalFilled / totalFields) * 100);
  };

  const loadUserData = async () => {
    try {
      console.log("🔍 Starting to load user data...");

      const userData = await fetchUserDetails();
      console.log("📦 Received user data:", userData);

      let userId;
      if (userData.id) {
        userId = userData.id;
      } else if (userData._id) {
        userId =
          typeof userData._id === "string"
            ? userData._id
            : userData._id.$oid || userData._id.toString();
      } else {
        throw new Error("No user ID found in user data");
      }

      console.log("✅ Extracted userId:", userId);

      if (!userId || userId === "undefined" || userId === "") {
        throw new Error("Invalid userId extracted from user data");
      }

      setUserDetails({
        userId: userId,
        email: userData.email || "",
        name: userData.name || userData.username || "",
        color: userData.color || "blue",
      });

      console.log("🎯 Set userDetails with userId:", userId);

      const profileData = await fetchProfile(userId);
      console.log("📊 Profile data received:", profileData);

      if (profileData) {
        const themeColor = profileData.themeColor || themeColors[0];
        setProfile((prev) => ({
          ...prev,
          ...profileData,
          userId: userId,
          themeColor: themeColor,
          hobbies: profileData.hobbies || [],
        }));
        console.log("✅ Profile loaded successfully");
      } else {
        setProfile((prev) => ({
          ...prev,
          userId: userId,
        }));
        console.log("ℹ️ No existing profile, initialized with userId");
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      alert(
        `Failed to load profile data: ${error.message}. Please refresh the page.`
      );
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    setSaving(true);
    try {
      console.log("💾 Starting save process...");

      if (
        !userDetails.userId ||
        userDetails.userId === "" ||
        userDetails.userId === "undefined"
      ) {
        throw new Error(
          "Invalid userId. Please refresh the page and try again."
        );
      }

      const profileData = {
        userId: userDetails.userId,
        themeColor: {
          name: profile.themeColor.name,
          value: profile.themeColor.value,
          border: profile.themeColor.border,
        },
        age: profile.age || "",
        brand: profile.brand || "",
        priceRange: profile.priceRange || "",
        occupation: profile.occupation || "",
        travelMode: profile.travelMode || "",
        livingStatus: profile.livingStatus || "",
        hobbies: profile.hobbies || [],
        location: profile.location || "",
        pets: profile.pets || "",
        petType: profile.petType || "",
        paymentMode: profile.paymentMode || "",
      };

      const result = await updateProfile(profileData);
      console.log("✅ Save result:", result);

      setHasChanges(false);
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert(`Failed to save profile: ${error.message}`);
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
            handleUpdate("location", location);
          } catch (error) {
            handleUpdate(
              "location",
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            );
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationLoading(false);
          alert("Unable to get location. Please enable location services.");
        }
      );
    } else {
      setLocationLoading(false);
      alert("Geolocation is not supported by your browser.");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  const completion = calculateCompletion();
  const selectedColorClass = profile.themeColor.value.replace("bg-", "text-");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Complete your profile to get personalized recommendations
          </p>
          {/* User Info Display */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{userDetails.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{userDetails.email}</span>
            </div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center mb-12">
          <CircularProgress
            percentage={completion}
            color={selectedColorClass}
          />
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Theme Color */}
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
                  } transition-all duration-200 ${
                    profile.themeColor.name === color.name
                      ? "ring-4 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <User className="w-5 h-5 mr-2" />
              Age
            </label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => handleUpdate("age", e.target.value)}
              placeholder="Enter your age"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Brand Preference */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Heart className="w-5 h-5 mr-2" />
              Favorite Brand
            </label>
            <input
              type="text"
              value={profile.brand}
              onChange={(e) => handleUpdate("brand", e.target.value)}
              placeholder="Enter your favorite brand"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <DollarSign className="w-5 h-5 mr-2" />
              Price Range
            </label>
            <select
              value={profile.priceRange}
              onChange={(e) => handleUpdate("priceRange", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select price range</option>
              {priceRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Briefcase className="w-5 h-5 mr-2" />
              Occupation
            </label>
            <input
              type="text"
              value={profile.occupation}
              onChange={(e) => handleUpdate("occupation", e.target.value)}
              placeholder="Enter your occupation"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Travel Mode */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Car className="w-5 h-5 mr-2" />
              Mode of Travel
            </label>
            <select
              value={profile.travelMode}
              onChange={(e) => handleUpdate("travelMode", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select travel mode</option>
              {travelModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {/* Living Status */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Home className="w-5 h-5 mr-2" />
              Living Status
            </label>
            <div className="flex gap-4">
              {["Bachelor", "Family"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdate("livingStatus", status)}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    profile.livingStatus === status
                      ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Heart className="w-5 h-5 mr-2" />
              Hobbies
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hobbiesOptions.map((hobby) => (
                <button
                  key={hobby}
                  onClick={() => toggleHobby(hobby)}
                  className={`py-2 px-4 rounded-lg border-2 transition-all text-sm ${
                    profile.hobbies.includes(hobby)
                      ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleUpdate("location", e.target.value)}
                placeholder="Enter your location"
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button
                onClick={getLocation}
                disabled={locationLoading}
                className={`px-6 py-3 rounded-lg ${profile.themeColor.value} text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {locationLoading ? "Getting..." : "Auto-Detect"}
              </button>
            </div>
          </div>

          {/* Pets */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              🐾 Pets
            </label>
            <div className="flex gap-4">
              {["Yes", "No"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleUpdate("pets", option)}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    profile.pets === option
                      ? `${profile.themeColor.border} ${profile.themeColor.value} text-white`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Pet Type - Only show if pets is "Yes" */}
          {profile.pets === "Yes" && (
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                🐶 Pet Type
              </label>
              <select
                value={profile.petType}
                onChange={(e) => handleUpdate("petType", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Select pet type</option>
                {petTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <CreditCard className="w-5 h-5 mr-2" />
              Preferred Payment Mode
            </label>
            <select
              value={profile.paymentMode}
              onChange={(e) => handleUpdate("paymentMode", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">Select payment mode</option>
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveToDatabase}
            disabled={!hasChanges || saving}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              hasChanges && !saving
                ? `${profile.themeColor.value} text-white hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105`
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving
              ? "Saving..."
              : hasChanges
              ? "Save Profile"
              : "No Changes to Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
