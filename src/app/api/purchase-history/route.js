import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import PurchaseHistory from "@app/models/PurchaseHistory";

export async function GET(req) {
  console.log("📜 [PURCHASE HISTORY API] GET request received");

  try {
    const session = await getServerSession(authOptions);
    console.log(
      "📜 [PURCHASE HISTORY API] Session:",
      session ? "Found" : "Not found"
    );

    if (!session?.user?.id) {
      console.log(
        "❌ [PURCHASE HISTORY API] Unauthorized - no session or user ID"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();
    console.log("📜 [PURCHASE HISTORY API] Connected to DB");

    // Extract query params
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId") || session.user.id;

    // ✅ Case 1: Specific product → return most frequent quantity (average if tie)
    if (productId) {
      console.log(
        `📦 [PURCHASE HISTORY API] Checking most frequent quantity for user=${userId}, product=${productId}`
      );

      const purchases = await PurchaseHistory.find({
        user_id: userId,
        "items.product_id": productId,
      }).lean();

      console.log("📜 Found purchases:", purchases.length);

      if (!purchases.length) {
        return NextResponse.json({ mostFrequentQuantity: 0 }, { status: 200 });
      }

      // Collect all quantities for that product
      const quantities = purchases.flatMap((p) =>
        p.items
          .filter((i) => i.product_id === productId)
          .map((i) => Number(i.quantity))
      );

      console.log("📊 Quantities:", quantities);

      // Build frequency map
      const freq = {};
      for (const q of quantities) freq[q] = (freq[q] || 0) + 1;
      console.log("📊 Frequency map:", freq);

      // Find the maximum frequency
      const maxFreq = Math.max(...Object.values(freq));

      // Find all quantities that share this frequency
      const tiedQuantities = Object.entries(freq)
        .filter(([_, f]) => f === maxFreq)
        .map(([q]) => Number(q));

      let mostFrequentQuantity;
      if (tiedQuantities.length > 1) {
        // 🤝 Tie → take average
        const avg =
          tiedQuantities.reduce((sum, q) => sum + q, 0) / tiedQuantities.length;
        mostFrequentQuantity = Math.round(avg); // or keep exact avg if preferred
        console.log(
          `🤝 Tie detected among [${tiedQuantities.join(
            ", "
          )}], average = ${avg}`
        );
      } else {
        mostFrequentQuantity = tiedQuantities[0];
      }

      console.log("🏆 Most frequent quantity:", mostFrequentQuantity);

      return NextResponse.json({ mostFrequentQuantity }, { status: 200 });
    }

    // ✅ Case 2: No productId → return full purchase history
    const purchases = await PurchaseHistory.find({
      user_id: session.user.id,
    })
      .sort({ transaction_date: -1 })
      .lean();

    console.log(
      "📜 [PURCHASE HISTORY API] Found purchases:",
      purchases?.length || 0
    );

    return NextResponse.json({ purchases: purchases || [] }, { status: 200 });
  } catch (error) {
    console.error(
      "❌ [PURCHASE HISTORY API] Error fetching purchase history:",
      error
    );
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
