import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import PurchaseHistory from "@/app/models/PurchaseHistory";

export async function GET(req) {
  try {
    // Get session with proper context
    const session = await getServerSession(authOptions);

    console.log("🔍 [ADMIN PURCHASE HISTORY API] Session check:", {
      hasSession: !!session,
      email: session?.user?.email,
      role: session?.user?.role,
    });

    if (!session || session.user.role !== "admin") {
      console.log("❌ [ADMIN PURCHASE HISTORY API] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ [ADMIN PURCHASE HISTORY API] Admin access granted");

    await connectToDB();

    // Fetch ALL purchase history (no user_id filter for admin)
    const purchases = await PurchaseHistory.find({})
      .select("user_id items transaction_date") // Only needed fields
      .lean();

    console.log(
      `📊 [ADMIN PURCHASE HISTORY API] Found ${purchases.length} purchases`
    );

    return NextResponse.json({ purchases }, { status: 200 });
  } catch (error) {
    console.error("❌ [ADMIN PURCHASE HISTORY API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase history" },
      { status: 500 }
    );
  }
}
