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
      <head>
        {/* ✅ Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="http://localhost:3000" />

        {/* ✅ Preload key font (adjust name if your app uses a specific font) */}
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* ✅ Preload hero/LCP image */}
        <link
          rel="preload"
          as="image"
          href="/_next/static/media/Appliances.png"
          imageSrcSet="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FAppliances.png&w=640 640w, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2FAppliances.png&w=1200 1200w"
        />
      </head>

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
