import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import UserPreference from "@/app/models/UserPreference";

export async function GET(req) {
  try {
    // Get session with proper context
    const session = await getServerSession(authOptions);

    console.log("🔍 [ADMIN PREFERENCES API] Session check:", {
      hasSession: !!session,
      email: session?.user?.email,
      role: session?.user?.role,
    });

    if (!session || session.user.role !== "admin") {
      console.log("❌ [ADMIN PREFERENCES API] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [ADMIN PREFERENCES API] Admin access granted");

    await connectToDB();

    // Fetch ALL user preferences (no userId filter for admin)
    const preferences = await UserPreference.find({})
      .select("userId preferences") // Only needed fields
      .lean();

    console.log(
      `📊 [ADMIN PREFERENCES API] Found ${preferences.length} preference records`
    );

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error("❌ [ADMIN PREFERENCES API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
