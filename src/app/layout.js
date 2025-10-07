import React from "react";
import { Provider } from "./components/Nav/Provider";
import { Nav } from "./components/Nav/Nav";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { useSystemTheme } from "./hooks/useSystemTheme";
import ThemeProvider from "./components/ThemeProvider";
import { CartProvider } from "./context/CartContent";
import ProfilePopupManager from "./components/ProfilePopupManager/ProfilePopupManager";
import { ColorProvider } from "./context/ColorContext";
export const metadata = {
  title: "Online Shopping website",
  description: "E-commerce Website",
  icons: {
    icon: [
      {
        url: "/logo.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/fav.jpeg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};
export default async function Rootlayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body>
        <Provider session={session}>
          <ColorProvider>
            <ThemeProvider>
              <CartProvider>
                <Nav />
                {children}
                <ProfilePopupManager />
              </CartProvider>
            </ThemeProvider>
          </ColorProvider>
        </Provider>
      </body>
    </html>
  );
}
