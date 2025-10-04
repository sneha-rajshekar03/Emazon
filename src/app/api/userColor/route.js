import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import Profile from "@app/models/Profile";
import User from "@app/models/user";

export async function GET() {
  try {
    console.log("🎯 [GET /api/user/color] Starting request...");

    // 1️⃣ Get session
    const session = await getServerSession(authOptions);
    console.log("🧑 Session user:", session?.user?.email || "No session");

    if (!session?.user?.email) {
      console.log("❌ No authenticated session found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2️⃣ Connect to MongoDB
    await connectToDB();
    console.log("✅ Connected to MongoDB");

    // 3️⃣ Find user by email → get their _id
    const dbUser = await User.findOne(
      { email: session.user.email },
      { _id: 1 }
    ).lean();
    console.log(
      "🔍 Found user ID:",
      dbUser?._id?.toString() || "User not found"
    );

    if (!dbUser?._id) {
      console.log("❌ User not found in DB");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4️⃣ Fetch profile by userId → only themeColor.value
    const userProfile = await Profile.findOne(
      { userId: dbUser._id.toString() },
      { "themeColor.value": 1, _id: 0 }
    ).lean();
    console.log("🧾 Profile fetched:", userProfile || "No profile found");

    // 5️⃣ Extract color value (with fallback)
    const colorValue = userProfile?.themeColor?.value || "bg-gray-200";
    console.log("🎨 Final color value:", colorValue);

    // 6️⃣ Return only color value
    console.log("✅ [GET /api/user/color] Success");
    return NextResponse.json({ color: colorValue });
  } catch (error) {
    console.error("💥 Error fetching user color:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
