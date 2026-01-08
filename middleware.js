// middleware.js (at root level)
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // If accessing root after login
  if (path === "/" && token) {
    // Admin → /admin
    if (token.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Regular user → /shop
    return NextResponse.redirect(new URL("/shop", request.url));
  }

  // Protect admin routes
  if (path.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/shop", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
