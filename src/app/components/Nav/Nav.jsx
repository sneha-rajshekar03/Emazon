"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import "../../styles/globals.css";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { Language } from "./Language";
import { Account } from "./Account";
import { CartIcon } from "./CartIcon";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { usePreferences } from "@app/hooks/usePreferences";
export const Nav = ({ color }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";
  const { signOutWithSave } = usePreferences();

  // 👇 This will always log in your browser dev console
  console.log("Session image URL:", session?.user?.image);
  console.log("Full session object:", session);

  return (
    <nav className="bg-[#eeeef2] p-2 flex items-center">
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
                <Link href="/profile">
                  <Image
                    src={session.user.image}
                    alt="Profile Image"
                    width={37}
                    height={37}
                    className="rounded-full border-2 border-red-200 cursor-pointer"
                  />
                </Link>
                <div className="hidden md:flex">
                  <CartIcon />
                </div>
                <button
                  type="button"
                  onClick={() => signOutWithSave()}
                  className="px-3 py-1.5 text-sm rounded transition font-medium shadow-sm"
                  style={{
                    background: `linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.01),
  ${color || "rgba(240, 245, 255, 0.02)"}
)`,
                    color: "#333", // keep text dark for better readability
                    border: `1px solid ${color || "rgba(255, 99, 99, 0.5)"}`,
                  }}
                >
                  Sign Out
                </button>
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
