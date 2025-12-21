"use client";
import React, { useState, useEffect } from "react";
import { useColor } from "@/app/context/ColorContext";
import { useSession } from "next-auth/react";

const NewsLetter = () => {
  const { hexColor, isDarkMode } = useColor();
  const { data: session } = useSession();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Check if user is returning and prefill email
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
      checkIfSubscribed(session.user.email);
    }
  }, [session]);

  // Check if user is already subscribed
  const checkIfSubscribed = async (userEmail) => {
    try {
      const res = await fetch(
        `/api/newsletter/check?email=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      if (data.isSubscribed) {
        setIsReturningUser(true);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  // Simple email validation
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubscribe = async () => {
    setMessage("");
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      setMessage(data.message);

      // Update returning user status
      if (data.isReturning !== undefined) {
        setIsReturningUser(data.isReturning);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      console.error("Newsletter subscribe error:", err);
      setError(err.message || "Something went wrong. Please try again.");

      // Clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSubscribe();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center text-center space-y-2 pt-10 pb-14 mx-4 my-10 transition-all duration-500 rounded-2xl"
      style={{
        background: isDarkMode
          ? "linear-gradient(160deg, rgba(40,40,40,0.75), rgba(30,30,30,0.35))"
          : "linear-gradient(160deg, rgba(255,255,255,0.75), rgba(255,255,255,0.35))",
        backdropFilter: "blur(25px) saturate(200%)",
        WebkitBackdropFilter: "blur(25px) saturate(200%)",
        boxShadow: isDarkMode
          ? "0 8px 40px rgba(0,0,0,0.3)"
          : "0 8px 40px rgba(0,0,0,0.06)",
      }}
    >
      <h1
        className={`md:text-4xl text-2xl font-semibold ${
          isDarkMode ? "text-gray-100" : "text-gray-800"
        }`}
      >
        {isReturningUser ? (
          <>Welcome back {session?.user?.name.split(" ")[0]} !</>
        ) : (
          <>Join our newsletter</>
        )}
      </h1>

      <p
        className={`md:text-base pb-6 max-w-xl ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {isReturningUser
          ? "Stay updated with our latest exclusive offers and deals."
          : "Subscribe now and get updates, offers, and early access straight to your inbox."}
      </p>

      <div className="flex items-center max-w-2xl w-full md:h-14 h-12 px-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your email"
          disabled={loading}
          className={`h-full w-full rounded-l-xl px-4 text-sm outline-none transition-all ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
          }`}
          style={{
            background: isDarkMode
              ? "rgba(50,50,50,0.6)"
              : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(14px)",
          }}
        />

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`
    px-8 md:px-14 lg:px-16
    h-full font-medium rounded-r-xl
    transition-all duration-300
    disabled:opacity-60 
        cursor-pointer
    disabled:cursor-not-allowed
    hover:opacity-90
    hover:scale-[1.03]
    active:scale-[0.97]
  `}
          style={{
            background: `linear-gradient(135deg, ${hexColor}, ${hexColor}cc)`,
            color: session?.user ? "#ffffff" : "#000000",
          }}
        >
          {loading
            ? "Processing..."
            : isReturningUser
            ? "Stay Updated"
            : "Subscribe"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-sm mt-3 animate-pulse">{error}</p>
      )}

      {/* Success Message */}
      {message && (
        <p className="text-green-400 text-sm mt-3 animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default NewsLetter;
