"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProfileData } from "@app/hooks/useProfileData";
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

const POPUP_INTERVAL_MS = 9000;
const POPUP_INITIAL_DELAY_MS = 1000;

const iconMap = {
  User,
  Heart,
  DollarSign,
  Briefcase,
  Car,
  Home,
  CreditCard,
  MapPin,
};

const profileQuestions = [
  {
    field: "age",
    question: "How old are you?",
    type: "number",
    placeholder: "Enter your age",
    icon: "User",
  },
  {
    field: "brand",
    question: "What's your favorite brand?",
    type: "text",
    placeholder: "e.g., Apple, Nike",
    icon: "Heart",
  },
  {
    field: "priceRange",
    question: "What's your typical spending range?",
    type: "select",
    options: [
      "Under $50",
      "$50 - $100",
      "$100 - $250",
      "$250 - $500",
      "$500 - $1000",
      "Above $1000",
    ],
    icon: "DollarSign",
  },
  {
    field: "occupation",
    question: "What do you do for a living?",
    type: "text",
    placeholder: "Enter your occupation",
    icon: "Briefcase",
  },
  {
    field: "travelMode",
    question: "How do you usually get around?",
    type: "select",
    options: ["Car", "Bike", "Public Transport", "Walking", "Multiple"],
    icon: "Car",
  },
  {
    field: "livingStatus",
    question: "What's your living situation?",
    type: "buttons",
    options: ["Bachelor", "Family"],
    icon: "Home",
  },
  {
    field: "hobbies",
    question: "What are your hobbies?",
    type: "multi-select",
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
    icon: "Heart",
  },
  {
    field: "location",
    question: "Where are you located?",
    type: "text",
    placeholder: "Enter your city/location",
    hasAutoDetect: true,
    icon: "MapPin",
  },
  {
    field: "pets",
    question: "Do you have any pets?",
    type: "buttons",
    options: ["Yes", "No"],
    icon: "Heart",
  },
  {
    field: "petType",
    question: "What type of pet do you have?",
    type: "select",
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
    condition: (profile) => profile.pets === "Yes",
    icon: "Heart",
  },
  {
    field: "paymentMode",
    question: "How do you prefer to pay?",
    type: "select",
    options: ["Cash", "Credit Card", "Debit Card", "UPI", "Digital Wallet"],
    icon: "CreditCard",
  },
].map((q) => ({ ...q, icon: iconMap[q.icon] }));

export default function ProfilePopupManager() {
  const pathname = usePathname();
  const { status } = useSession();
  const { profileData: profile, loading, saveProfile } = useProfileData();

  const [locationLoading, setLocationLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);

  const showNextQuestion = useCallback(() => {
    if (showPopup || !profile) return;

    const unanswered = profileQuestions.filter((q) => {
      if (q.condition && !q.condition(profile)) return false;
      const value = profile[q.field];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
      return isEmpty && !askedQuestions.includes(q.field);
    });

    if (unanswered.length > 0) {
      const nextQuestion =
        unanswered[Math.floor(Math.random() * unanswered.length)];

      setCurrentQuestion(nextQuestion);

      if (nextQuestion.type === "multi-select") {
        setSelectedHobbies(profile.hobbies || []);
      } else {
        setAnswer(profile[nextQuestion.field] || "");
      }

      setShowPopup(true);
    }
  }, [profile, askedQuestions, showPopup]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (loading || !profile) return;
    if (pathname.toLowerCase().includes("/profile")) return;

    const initialTimeout = setTimeout(() => {
      showNextQuestion();
    }, POPUP_INITIAL_DELAY_MS);

    const intervalTimer = setInterval(() => {
      showNextQuestion();
    }, POPUP_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, loading, profile, pathname]);

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

    try {
      let valueToSave =
        currentQuestion.type === "multi-select" ? selectedHobbies : answer;

      if (currentQuestion.type === "number") {
        valueToSave = parseInt(valueToSave, 10);
        if (isNaN(valueToSave) || valueToSave <= 0) {
          throw new Error("Please enter a valid number");
        }
      }

      const updatedFields = {
        [currentQuestion.field]: valueToSave,
        ...(currentQuestion.field === "pets" && valueToSave === "No"
          ? { petType: "" }
          : {}),
      };

      // Save to database
      const result = await saveProfile(updatedFields);

      if (!result.success) {
        throw new Error(result.message || "Failed to save");
      }

      handlePopupClose();
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message || "Failed to save. Please try again.");
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

  if (status === "loading") return null;
  if (status !== "authenticated") return null;
  if (!profile || !showPopup) return null;

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
      saving={false}
      isAnswerValid={isAnswerValid()}
      toggleHobby={togglePopupHobby}
    />
  );
}
