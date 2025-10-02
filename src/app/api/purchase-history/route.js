import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import PurchaseHistory from "@app/models/PurchaseHistory";

// GET - Fetch user's purchase history
export async function GET(req) {
  console.log("📜 [PURCHASE HISTORY API] GET request received");
  try {
    const session = await getServerSession(authOptions);
    console.log(
      "📜 [PURCHASE HISTORY API] Session:",
      session ? "Found" : "Not found"
    );
    console.log("📜 [PURCHASE HISTORY API] User ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log(
        "❌ [PURCHASE HISTORY API] Unauthorized - no session or user ID"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📜 [PURCHASE HISTORY API] Connecting to DB...");
    await connectToDB();

    console.log(
      "📜 [PURCHASE HISTORY API] Fetching purchases for user:",
      session.user.id
    );
    const purchases = await PurchaseHistory.find({ user_id: session.user.id })
      .sort({ purchase_date: -1 })
      .lean();

    console.log(
      "📜 [PURCHASE HISTORY API] Found purchases:",
      purchases?.length || 0
    );

    return NextResponse.json({
      purchases: purchases || [],
    });
  } catch (error) {
    console.error(
      "❌ [PURCHASE HISTORY API] Error fetching purchase history:",
      error
    );
    console.error("❌ [PURCHASE HISTORY API] Error stack:", error.stack);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
