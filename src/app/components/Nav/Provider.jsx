"use client";
import React from "react";

import { SessionProvider } from "next-auth/react";
export const Provider = ({ children, session }) => {
  console.log(session);
  return <SessionProvider session={session}>{children}</SessionProvider>;
};
