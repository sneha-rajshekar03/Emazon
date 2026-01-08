import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import User from "@/app/models/User";

export async function GET(req) {
  try {
    // Get session - IMPORTANT: Pass authOptions AND request
    const session = await getServerSession(authOptions);

    console.log("🔍 [ADMIN USERS API] Session check:", {
      hasSession: !!session,
      email: session?.user?.email,
      role: session?.user?.role,
    });

    if (!session || session.user.role !== "admin") {
      console.log("❌ [ADMIN USERS API] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [ADMIN USERS API] Admin access granted");

    await connectToDB();

    // Fetch all users with only necessary fields (privacy-safe)
    const users = await User.find({})
      .select("email role createdAt") // Only needed fields
      .lean();

    console.log(`📊 [ADMIN USERS API] Found ${users.length} users`);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("❌ [ADMIN USERS API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
