"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import "../../styles/globals.css";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { Language } from "./Language";
import { Account } from "./Account";
import CartButton from "./CartIcon";
import { WelcomeGreeting } from "./WelcomeGreeting";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePreferences } from "@/app/hooks/usePreferences";
import { useColor } from "@/app/context/ColorContext";
import {
  ChevronDown,
  User,
  ShoppingBag,
  LogOut,
  ShoppingCart,
} from "lucide-react";

const ProfileImageWithProgress = ({ imageUrl, completion = 0, hexColor }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className="relative w-[37px] h-[37px]">
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="18.5"
          cy="18.5"
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="18.5"
          cy="18.5"
          r={radius}
          stroke={hexColor || "#007AFF"}
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 5px ${hexColor || "#007AFF"}40)`,
            transition: "all 0.3s ease",
          }}
        />
      </svg>
      <div className="absolute inset-[3px] rounded-full overflow-hidden">
        <Image
          src={imageUrl}
          alt="Profile Image"
          width={31}
          height={31}
          className="rounded-full cursor-pointer"
        />
      </div>
    </div>
  );
};

export const Nav = () => {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "Guest";
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";
  const { signOutWithSave } = usePreferences();
  const { hexColor, isDarkMode } = useColor();

  console.log("🎯 Nav rendering - Session:", userName, "Status:", status);

  const [profileCompletion, setProfileCompletion] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themeColor = hexColor || (isDarkMode ? "#A0A0A0" : "#D0D3D7");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Profile completion
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/profile?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const profile = data.data;
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
            const filled = fields.filter((f) => f && f !== "").length;
            const hobbiesScore = profile.hobbies?.length > 0 ? 1 : 0;
            const petTypeScore =
              profile.pets === "Yes" && profile.petType ? 1 : 0;
            const totalFields =
              fields.length + 1 + (profile.pets === "Yes" ? 1 : 0);
            const totalFilled = filled + hobbiesScore + petTypeScore;
            const completion = Math.round((totalFilled / totalFields) * 100);
            setProfileCompletion(completion);
          }
        })
        .catch((err) =>
          console.error("Failed to fetch profile completion:", err)
        );
    }
  }, [session]);

  return (
    <>
      {/* Welcome Greeting Message - Pass userName as prop */}
      {!hideOnLogin && (
        <WelcomeGreeting
          isDarkMode={isDarkMode}
          hexColor={hexColor}
          userName={userName}
        />
      )}

      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-2 flex items-center justify-between transition-all duration-500"
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeColor}15 0%, rgba(32,32,32,0.9) 100%)`
            : `linear-gradient(135deg, ${themeColor}20 0%, rgba(255,255,255,0.85) 100%)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isDarkMode
            ? `1px solid ${themeColor}20`
            : `1px solid ${themeColor}30`,
          boxShadow: isDarkMode
            ? "0 1px 3px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {!hideOnLogin && (
          <>
            {/* Search Bar */}
            <div className="flex-1 mx-6">
              <SearchBar />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-5">
              <div className="hidden md:flex">
                <Language />
              </div>

              {session?.user ? (
                <div className="flex items-center gap-4">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 hover:opacity-90 transition"
                    >
                      <ProfileImageWithProgress
                        imageUrl={session.user.image}
                        completion={profileCompletion}
                        hexColor={themeColor}
                      />
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                        style={{ color: themeColor }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute right-0 mt-3 w-60 rounded-2xl overflow-hidden z-50 shadow-2xl animate-fadeIn"
                        style={{
                          background: isDarkMode
                            ? `linear-gradient(180deg, rgba(45,45,45,0.98), rgba(35,35,35,0.96))`
                            : `linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,245,245,0.96))`,
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: `1px solid ${themeColor}40`,
                          boxShadow: isDarkMode
                            ? `0 4px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
                            : `0 4px 25px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)`,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {/* Profile Header */}
                        <div
                          className="px-5 pb-2 border-b mb-2 mt-2"
                          style={{ borderColor: `${themeColor}30` }}
                        >
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-100" : "text-gray-800"
                            }`}
                          >
                            {session.user.name || session.user.email}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {session.user.email}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="flex-1 h-1 rounded-full overflow-hidden"
                              style={{
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.15)"
                                  : "rgba(0,0,0,0.1)",
                              }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${profileCompletion}%`,
                                  background: hexColor || "#007AFF",
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-medium"
                              style={{ color: hexColor || "#007AFF" }}
                            >
                              {profileCompletion}%
                            </span>
                          </div>
                        </div>

                        {/* Links */}
                        <div className="flex flex-col gap-1 px-2 pb-2">
                          <Link
                            href="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              isDarkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${themeColor}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <User
                              className="w-4 h-4"
                              style={{ color: themeColor }}
                            />
                            <span className="text-sm font-medium">
                              My Profile
                            </span>
                          </Link>

                          <Link
                            href="/purchase-history"
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              isDarkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${themeColor}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <ShoppingBag
                              className="w-4 h-4"
                              style={{ color: themeColor }}
                            />
                            <span className="text-sm font-medium">
                              Purchase History
                            </span>
                          </Link>

                          {/* Cart option - visible only on medium screens and below */}
                          <div className="md:hidden">
                            <Link
                              href="/Cart"
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isDarkMode ? "text-gray-200" : "text-gray-700"
                              }`}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${themeColor}15`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <ShoppingCart
                                className="w-4 h-4"
                                style={{ color: themeColor }}
                              />
                              <span className="text-sm font-medium">
                                My Cart
                              </span>
                            </Link>
                          </div>
                        </div>

                        {/* Sign Out */}
                        <div
                          className="border-t"
                          style={{ borderColor: `${themeColor}25` }}
                        >
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              signOutWithSave();
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-200 ${
                              isDarkMode
                                ? "text-red-400 hover:bg-red-900/20"
                                : "text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Sign Out
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cart button - hidden on medium screens and below */}
                  <div className="hidden lg:flex">
                    <CartButton />
                  </div>
                </div>
              ) : (
                <Account />
              )}
            </div>
          </>
        )}
      </nav>
    </>
  );
};
