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

export const Nav = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";

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
                  onClick={() => signOut()}
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Account />
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
};
