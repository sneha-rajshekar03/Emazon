import React from "react";
import Link from "next/link";
export const Account = () => (
  <Link
    href="\login"
    className="flex flex-col text-blaxk text-sm cursor-pointer hover:underline"
  >
    <span>Hello, Sign in</span>
    <span className="font-bold">Account & Lists</span>
  </Link>
);
