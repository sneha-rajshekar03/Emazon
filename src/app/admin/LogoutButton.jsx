// app/admin/LogoutButton.jsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-full transition-all hover:scale-105 active:scale-95"
    >
      Logout
    </button>
  );
}
