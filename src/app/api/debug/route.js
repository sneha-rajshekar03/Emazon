import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
  const session = await getServerSession(authOptions); // no req/res needed in App Router

  if (!session) {
    return NextResponse.json(
      { loggedIn: false, message: "Not logged in" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    loggedIn: true,
    user: session.user,
  });
}
