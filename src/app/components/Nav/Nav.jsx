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
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { usePreferences } from "@app/hooks/usePreferences";
import { ChevronDown, User, ShoppingBag, LogOut } from "lucide-react";

const ProfileImageWithProgress = ({ imageUrl, completion = 0 }) => {
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
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="18.5"
          cy="18.5"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-[3px]">
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

export const Nav = ({ color }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";
  const { signOutWithSave } = usePreferences();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            const filledFields = fields.filter((f) => f && f !== "").length;
            const hobbiesScore = profile.hobbies?.length > 0 ? 1 : 0;
            const petTypeScore =
              profile.pets === "Yes" && profile.petType ? 1 : 0;
            const totalFields =
              fields.length + 1 + (profile.pets === "Yes" ? 1 : 0);
            const totalFilled = filledFields + hobbiesScore + petTypeScore;
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
    <nav className="bg-background text-foreground p-2 flex items-center shadow-sm">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Logo />
      </div>

      {!hideOnLogin && (
        <>
          {/* Search bar */}
          <div className="flex-1 mx-4">
            <SearchBar />
          </div>

          {/* Right-side icons */}
          <div className="flex items-center gap-4">
            {/* Language selector (desktop only) */}
            <div className="hidden md:flex">
              <Language />
            </div>

            {/* Account / Profile / Cart */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition"
                  >
                    <ProfileImageWithProgress
                      imageUrl={session.user.image}
                      completion={profileCompletion}
                    />
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                          {session.user.name || session.user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-gray-700"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>

                      <Link
                        href="/purchase-history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-gray-700"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-sm">Purchase History</span>
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOutWithSave();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="hidden md:flex">
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
  );
};
