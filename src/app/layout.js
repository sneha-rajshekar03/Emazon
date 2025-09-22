import React from "react";
import { Provider } from "./components/Nav/Provider";
import { Nav } from "./components/Nav/Nav";
export const metadata = {
  title: "Online Shopping website",
  description: "E-commerce Website",
  icons: { icon: "/favicon.png" },
};
export default function Rootlayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <Nav></Nav>
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  );
}
