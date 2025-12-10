import React from "react";
import { Provider } from "./components/Nav/Provider";
import { Nav } from "./components/Nav/Nav";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import ThemeProvider from "./components/ThemeProvider";
import { CartProvider } from "./context/CartContent";
import ProfilePopupManager from "./components/ProfilePopupManager/ProfilePopupManager";
import { ColorProvider } from "./context/ColorContext";
import { LanguageProvider } from "./context/LanguageContext";

export const metadata = {
  title: "Emzon | Online Shopping Website",
  description:
    "An e-commerce platform built with Next.js, Firebase & NextAuth.",
  icons: {
    icon: [
      { url: "/logo.svg", media: "(prefers-color-scheme: light)" },
      { url: "/fav.jpeg", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body>
        <Provider session={session}>
          <ColorProvider>
            <LanguageProvider>
              <ThemeProvider>
                <CartProvider>
                  <Nav />
                  <main>{children}</main>
                  <ProfilePopupManager />
                </CartProvider>
              </ThemeProvider>
            </LanguageProvider>
          </ColorProvider>
        </Provider>
      </body>
    </html>
  );
}
