import React from "react";
import Image from "next/image";
import Link from "next/link";
export const Logo = () => {
  return (
    <div>
      <Link href="/" className="flex flex-row  ">
        <Image
          src="/logo.svg"
          alt="Amazon Logo"
          width={40}
          height={30}
          className="rounded-full"
        />
        <h1 className="font-semibold p-1 mt-1 justify-center ">Emzon</h1>
      </Link>
    </div>
  );
};
