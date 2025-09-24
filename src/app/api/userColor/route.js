import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import User from "@app/models/user";
import { connectToDB } from "@app/utils/database";
export async function GET() {
  // 1️⃣ Get logged-in session
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2️⃣ Connect to MongoDB (if not already connected)
  await connectToDB();

  // 3️⃣ Fetch user from DB by email
  const dbUser = await User.findOne(
    { email: session.user.email },
    { color: 1 } // only fetch color
  ).lean();

  // 4️⃣ Merge session info + color
  const fullUser = {
    ...session.user,
    color: dbUser?.color || "#ffffff", // fallback to white if no color
  };

  // 5️⃣ Return user info including color
  return NextResponse.json({ loggedIn: true, user: fullUser });
}
