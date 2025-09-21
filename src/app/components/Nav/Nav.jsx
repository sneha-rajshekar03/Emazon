"use client";
import React from "react";
import "../../styles/globals.css";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { Language } from "./Language";
import { Account } from "./Account";
import { CartIcon } from "./CartIcon";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const pathname = usePathname();
  const hideOnLogin = pathname === "/login";

  return (
    <nav className="bg-[#eeeef2] p-2 flex items-center">
      <Logo />
      {!hideOnLogin && (
        <>
          <div className="flex-1 mx-4">
            <SearchBar />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <Language />
            </div>

            <Account />

            <div className="hidden md:flex">
              <CartIcon />
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
