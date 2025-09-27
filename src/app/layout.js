import React from "react";
import { Provider } from "./components/Nav/Provider";
import { Nav } from "./components/Nav/Nav";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export const metadata = {
  title: "Online Shopping website",
  description: "E-commerce Website",
  icons: { icon: "/favicon.png" },
};
export default async function Rootlayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body>
        <Provider session={session}>
          <Nav />
          {children}
        </Provider>
      </body>
    </html>
  );
}
