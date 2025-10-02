"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfilePopup } from "../ProfilePopup/ProfilePopup";
import {
  User,
  Heart,
  DollarSign,
  Briefcase,
  Car,
  Home,
  CreditCard,
  MapPin,
} from "lucide-react";

const POPUP_INTERVAL_MS = 40000;
const POPUP_INITIAL_DELAY_MS = 70000;

// Define your profile questions here
const profileQuestions = [
  {
    field: "age",
    question: "How old are you?",
    type: "number",
    placeholder: "Enter your age",
    icon: User,
  },
  {
    field: "relationshipStatus",
    question: "What's your relationship status?",
    type: "buttons",
    options: ["Single", "In a relationship", "Married", "complicated"],
    icon: Heart,
  },
  {
    field: "budget",
    question: "What's your monthly budget?",
    type: "select",
    options: ["Under $1000", "$1000-$3000", "$3000-$5000", "Above $5000"],
    icon: DollarSign,
  },
  {
    field: "occupation",
    question: "What do you do for work?",
    type: "text",
    placeholder: "e.g., Software Engineer, Teacher",
    icon: Briefcase,
  },
  {
    field: "transportation",
    question: "How do you get around?",
    type: "buttons",
    options: ["Car", "Public Transport", "Bike", "Walk"],
    icon: Car,
  },
  {
    field: "location",
    question: "Where are you located?",
    type: "text",
    placeholder: "Enter your city or location",
    hasAutoDetect: true,
    icon: MapPin,
  },
  {
    field: "housingType",
    question: "What's your housing situation?",
    type: "buttons",
    options: ["Own", "Rent", "With Family", "Other"],
    icon: Home,
  },
  {
    field: "hobbies",
    question: "What are your hobbies?",
    type: "multi-select",
    options: [
      "Reading",
      "Gaming",
      "Sports",
      "Cooking",
      "Travel",
      "Music",
      "Art",
      "Photography",
      "Fitness",
      "Gardening",
      "Movies",
      "Dancing",
    ],
    icon: Heart,
  },
];

export default function ProfilePopupManager() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);

  const showNextQuestion = useCallback(() => {
    console.log(
      "🎯 showNextQuestion called - showPopup:",
      showPopup,
      "profile:",
      !!profile
    );

    if (showPopup || !profile) {
      console.log("❌ Already showing popup or no profile");
      return;
    }

    const unanswered = profileQuestions.filter((q) => {
      if (q.condition && !q.condition(profile)) return false;
      const value = profile[q.field];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
      return isEmpty && !askedQuestions.includes(q.field);
    });

    console.log("📋 Unanswered questions:", unanswered.length);

    if (unanswered.length > 0) {
      const nextQuestion =
        unanswered[Math.floor(Math.random() * unanswered.length)];
      console.log("✅ Showing question:", nextQuestion.field);
      setCurrentQuestion(nextQuestion);
      if (nextQuestion.type === "multi-select") {
        setSelectedHobbies(profile.hobbies || []);
      } else {
        setAnswer(profile[nextQuestion.field] || "");
      }
      setShowPopup(true);
    } else {
      console.log("✅ All questions answered!");
    }
  }, [profile, askedQuestions, showPopup]);

  // Load profile data only for authenticated users
  useEffect(() => {
    console.log("🔍 ProfilePopupManager - Status:", status);
    console.log("🔍 ProfilePopupManager - Session:", session);

    // Don't load profile if not authenticated
    if (status !== "authenticated") {
      console.log("❌ Not authenticated, skipping profile load");
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const userId = session?.user?.id;
        console.log("👤 Loading profile for user:", userId);

        if (!userId) {
          console.error("User ID not found in session");
          setLoading(false);
          return;
        }

        const profileRes = await fetch(`/api/profile?userId=${userId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          console.log("✅ Profile loaded:", profileData.data);
          setProfile(profileData.data);
        } else {
          console.log("⚠️ No profile found, creating base profile");
          setProfile({ userId });
        }
      } catch (error) {
        console.error("Popup Manager Error:", error);
        setProfile({ userId: session?.user?.id });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [status, session?.user?.id]);

  // Setup popup timers only when profile is loaded and not on profile page
  useEffect(() => {
    console.log(
      "⏰ Timer effect - Status:",
      status,
      "Loading:",
      loading,
      "Profile:",
      !!profile,
      "Pathname:",
      pathname
    );

    // Don't setup timers if not authenticated
    if (status !== "authenticated") {
      console.log("❌ Timer: Not authenticated");
      return;
    }
    if (loading || !profile) {
      console.log("❌ Timer: Loading or no profile");
      return;
    }
    if (pathname.toLowerCase().includes("/profile")) {
      console.log("❌ Timer: On profile page");
      return;
    }

    console.log("✅ Setting up popup timers");
    const initialTimeout = setTimeout(() => {
      console.log("⏰ Initial timeout triggered");
      showNextQuestion();
    }, POPUP_INITIAL_DELAY_MS);

    const intervalTimer = setInterval(() => {
      console.log("⏰ Interval triggered");
      showNextQuestion();
    }, POPUP_INTERVAL_MS);

    return () => {
      console.log("🧹 Cleaning up timers");
      clearTimeout(initialTimeout);
      clearInterval(intervalTimer);
    };
  }, [status, loading, profile, pathname, showNextQuestion]);

  const handlePopupClose = () => {
    if (currentQuestion) {
      setAskedQuestions((prev) => [...prev, currentQuestion.field]);
    }
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
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          [currentQuestion.field]: valueToSave,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");

      setProfile((prev) => ({ ...prev, [currentQuestion.field]: valueToSave }));
      handlePopupClose();
    } catch (error) {
      console.error("Popup save error:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isAnswerValid = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "multi-select") {
      return selectedHobbies.length > 0;
    }
    if (currentQuestion.type === "number") {
      const num = parseInt(answer, 10);
      return !isNaN(num) && num > 0;
    }
    return answer && answer.toString().trim() !== "";
  };

  const togglePopupHobby = (hobby) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  // Check authentication status AFTER all hooks
  if (status === "loading") {
    return null; // Still checking auth status
  }

  if (status !== "authenticated") {
    return null; // Not logged in - no popups
  }

  // Don't render popup if no profile loaded or popup not shown
  if (!profile || !showPopup) {
    return null;
  }

  return (
    <ProfilePopup
      profile={profile}
      currentQuestion={currentQuestion}
      answer={answer}
      setAnswer={setAnswer}
      selectedHobbies={selectedHobbies}
      locationLoading={locationLoading}
      setLocationLoading={setLocationLoading}
      handleClose={handlePopupClose}
      handleSave={handlePopupSave}
      saving={saving}
      isAnswerValid={isAnswerValid()}
      toggleHobby={togglePopupHobby}
    />
  );
}
