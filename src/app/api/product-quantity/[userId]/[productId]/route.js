import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import PurchaseHistory from "@/app/models/PurchaseHistory";
import Cart from "@/app/models/Cart";

export async function GET(request) {
  const start = Date.now();
  console.log("\n========== [GET] /api/purchase-history ==========");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    await connectToDB();
    console.log("✅ Connected to MongoDB");

    // 🔹 Extract query parameters (userId & productId)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // from /api/profile
    const productId = searchParams.get("productId"); // optional
    console.log("📦 Query Params received:", { userId, productId });

    if (!userId) {
      console.log("❌ Missing userId");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 🔹 CASE 1: If productId provided → specific purchase lookup
    // ---------------------------------------------------------
    if (productId) {
      console.log(
        `🔍 Searching PurchaseHistory for product ${productId} of user ${userId}`
      );

      const recentPurchase = await PurchaseHistory.findOne({
        user_id: userId, // field in PurchaseHistory collection
        "items.product_id": productId,
      })
        .sort({ transaction_date: -1 })
        .lean();

      console.log(
        "🧾 PurchaseHistory Result:",
        JSON.stringify(recentPurchase, null, 2)
      );

      if (recentPurchase) {
        const matchedItem = recentPurchase.items.find(
          (p) => p.product_id?.toString() === productId
        );

        if (matchedItem) {
          console.log("✅ Found product in purchase history:", matchedItem);
          return NextResponse.json({
            success: true,
            source: "purchase_history",
            data: {
              transaction_id: recentPurchase.transaction_id,
              lastPurchaseDate: recentPurchase.transaction_date,
              product_id: matchedItem.product_id,
              quantity: matchedItem.quantity ?? null,
              unit_price: matchedItem.unit_price ?? null,
              total_amount: recentPurchase.total_amount ?? null,
            },
          });
        }
      }

      // 🔹 Fallback: check Cart
      console.log("🔍 Product not found in purchase history. Checking Cart...");
      const cart = await Cart.findOne({ user_id: userId }).lean();

      if (cart) {
        const matchedCartItem = cart.items.find(
          (p) => p.product_id?.toString() === productId
        );

        if (matchedCartItem) {
          console.log("✅ Found in Cart:", matchedCartItem);
          return NextResponse.json({
            success: true,
            source: "cart",
            data: matchedCartItem,
          });
        }
      }

      console.log(
        "⚠️ No purchase or cart record found for product:",
        productId
      );
      return NextResponse.json({
        success: false,
        message: "No purchase or cart record found for this product.",
      });
    }

    // ---------------------------------------------------------
    // 🔹 CASE 2: Fetch entire purchase history for user
    // ---------------------------------------------------------
    console.log("🔍 Fetching full purchase history for user:", userId);

    const allPurchases = await PurchaseHistory.find({ user_id: userId })
      .sort({ transaction_date: -1 })
      .lean();

    if (!allPurchases?.length) {
      console.log("⚠️ No purchase history found for user");
      return NextResponse.json({
        success: false,
        message: "No purchase history found for this user.",
        data: [],
      });
    }

    // 🔹 Extract all product IDs for quick reference
    const allProductIds = allPurchases.flatMap((p) =>
      p.items.map((item) => item.product_id)
    );

    console.log(`✅ Found ${allPurchases.length} purchase(s)`);
    console.log("🛒 Purchased Product IDs:", allProductIds);

    return NextResponse.json({
      success: true,
      source: "purchase_history",
      count: allPurchases.length,
      productIds: allProductIds,
      data: allPurchases,
    });
  } catch (error) {
    console.error("💥 Error fetching purchase history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchase history",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log(`⏱️ Request Duration: ${Date.now() - start}ms`);
    console.log("========== [END REQUEST] /api/purchase-history ==========\n");
  }
}
