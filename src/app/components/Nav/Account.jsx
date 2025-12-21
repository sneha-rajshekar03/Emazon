import React from "react";
import Link from "next/link";
import { useColor } from "@/app/context/ColorContext";

export const Account = () => {
  const { isDarkMode } = useColor();

  return (
    <Link
      href="/login"
      className={`flex flex-col text-sm cursor-pointer hover:underline ${
        isDarkMode ? "text-white" : "text-black"
      }`}
    >
      <span>Hello, Sign in</span>
      <span className="font-bold">Account & Lists</span>
    </Link>
  );
};
