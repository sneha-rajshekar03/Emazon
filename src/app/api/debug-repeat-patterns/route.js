// app/api/debug-repeat-patterns/route.js
// USE THIS TO DEBUG WHY SUGGESTIONS AREN'T APPEARING

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDB } from "@/app/utils/database";
import PurchaseHistory from "@/app/models/PurchaseHistory";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    // Fetch ALL purchases (not just completed)
    const allPurchases = await PurchaseHistory.find({
      user_id: session.user.id,
    })
      .select("transaction_date items status")
      .sort({ transaction_date: 1 })
      .lean();

    console.log("\n========================================");
    console.log("🔍 REPEAT PATTERN DEBUG FOR USER:", session.user.id);
    console.log("========================================\n");

    console.log("📊 TOTAL PURCHASES:", allPurchases.length);
    console.log(
      "✅ COMPLETED PURCHASES:",
      allPurchases.filter((p) => p.status === "completed").length
    );
    console.log("\n");

    if (allPurchases.length === 0) {
      console.log("❌ NO PURCHASES FOUND!");
      console.log("   → User needs purchase history to generate suggestions");
      return Response.json({
        error: "No purchases found",
        debug: {
          totalPurchases: 0,
          completedPurchases: 0,
          products: [],
          suggestion: "Create test purchases for this user",
        },
      });
    }

    // Group by product
    const productPurchases = new Map();

    allPurchases.forEach((purchase) => {
      if (purchase.status === "completed") {
        purchase.items.forEach((item) => {
          if (!productPurchases.has(item.product_id)) {
            productPurchases.set(item.product_id, []);
          }
          productPurchases.get(item.product_id).push({
            date: new Date(purchase.transaction_date),
            quantity: item.quantity,
            status: purchase.status,
          });
        });
      }
    });

    console.log("📦 UNIQUE PRODUCTS PURCHASED:", productPurchases.size);
    console.log("\n");

    // Analyze each product
    const productAnalysis = [];

    productPurchases.forEach((history, productId) => {
      console.log(`\n--- Product: ${productId} ---`);
      console.log(`Purchase count: ${history.length}`);

      if (history.length < 2) {
        console.log("❌ INELIGIBLE: Need at least 2 purchases");
        productAnalysis.push({
          product_id: productId,
          purchaseCount: history.length,
          eligible: false,
          reason: "Need at least 2 purchases",
        });
        return;
      }

      // Sort by date
      history.sort((a, b) => a.date - b.date);

      // Show purchase dates
      console.log("Purchase dates:");
      history.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.date.toISOString().split("T")[0]}`);
      });

      // Calculate intervals
      const intervals = [];
      for (let i = 1; i < history.length; i++) {
        const daysDiff = Math.floor(
          (history[i].date - history[i - 1].date) / 86400000
        );
        intervals.push(daysDiff);
        console.log(`  Interval ${i}: ${daysDiff} days`);
      }

      // Calculate average
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      console.log(`Average interval: ${Math.round(avgInterval)} days`);

      // Calculate consistency
      const variance =
        intervals.reduce(
          (sum, val) => sum + Math.pow(val - avgInterval, 2),
          0
        ) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - stdDev / avgInterval);
      console.log(
        `Consistency: ${(consistency * 100).toFixed(1)}% (need >= 40%)`
      );

      // Check criteria
      const lastPurchaseDate = history[history.length - 1].date;
      const today = new Date();
      const daysSinceLastPurchase = Math.floor(
        (today - lastPurchaseDate) / 86400000
      );

      console.log(`Days since last purchase: ${daysSinceLastPurchase}`);

      // Expected next date
      const expectedNextDate = new Date(lastPurchaseDate);
      expectedNextDate.setDate(
        expectedNextDate.getDate() + Math.round(avgInterval)
      );

      const daysUntilExpected = Math.floor(
        (expectedNextDate - today) / 86400000
      );

      console.log(
        `Expected next purchase: ${
          expectedNextDate.toISOString().split("T")[0]
        }`
      );
      console.log(`Days until expected: ${daysUntilExpected}`);
      console.log(
        `In reorder window (±3 days): ${
          daysUntilExpected >= -3 && daysUntilExpected <= 3 ? "YES ✅" : "NO ❌"
        }`
      );

      // Determine eligibility
      let eligible = true;
      let reason = "Eligible";

      if (consistency < 0.4) {
        eligible = false;
        reason = `Inconsistent pattern (${(consistency * 100).toFixed(
          1
        )}% < 40%)`;
      } else if (avgInterval < 7) {
        eligible = false;
        reason = `Interval too short (${Math.round(avgInterval)} days < 7)`;
      } else if (avgInterval > 90) {
        eligible = false;
        reason = `Interval too long (${Math.round(avgInterval)} days > 90)`;
      } else if (daysUntilExpected < -3 || daysUntilExpected > 3) {
        eligible = false;
        reason = `Outside reorder window (${daysUntilExpected} days from expected)`;
      }

      console.log(`\n${eligible ? "✅ ELIGIBLE" : "❌ INELIGIBLE"}: ${reason}`);

      productAnalysis.push({
        product_id: productId,
        purchaseCount: history.length,
        avgInterval: Math.round(avgInterval),
        consistency: parseFloat((consistency * 100).toFixed(1)),
        daysSinceLastPurchase,
        expectedNextDate: expectedNextDate.toISOString().split("T")[0],
        daysUntilExpected,
        inReorderWindow: daysUntilExpected >= -3 && daysUntilExpected <= 3,
        eligible,
        reason,
        purchaseDates: history.map((h) => h.date.toISOString().split("T")[0]),
      });
    });

    console.log("\n========================================");
    console.log("📋 SUMMARY");
    console.log("========================================");
    console.log(`Total products: ${productAnalysis.length}`);
    console.log(
      `Eligible: ${productAnalysis.filter((p) => p.eligible).length}`
    );
    console.log(
      `Ineligible: ${productAnalysis.filter((p) => !p.eligible).length}`
    );
    console.log("\n");

    if (productAnalysis.filter((p) => p.eligible).length === 0) {
      console.log("💡 WHY NO SUGGESTIONS?");
      const reasons = productAnalysis.map((p) => p.reason);
      const uniqueReasons = [...new Set(reasons)];
      uniqueReasons.forEach((r) => {
        const count = reasons.filter((reason) => reason === r).length;
        console.log(`   • ${r} (${count} product${count > 1 ? "s" : ""})`);
      });
      console.log("\n");
    }

    return Response.json({
      userId: session.user.id,
      totalPurchases: allPurchases.length,
      completedPurchases: allPurchases.filter((p) => p.status === "completed")
        .length,
      uniqueProducts: productAnalysis.length,
      eligibleProducts: productAnalysis.filter((p) => p.eligible).length,
      products: productAnalysis,
      currentDate: new Date().toISOString().split("T")[0],
      tips:
        productAnalysis.filter((p) => p.eligible).length === 0
          ? [
              "Make sure you have at least 2 completed purchases of the same product",
              "Purchase intervals should be between 7-90 days",
              "Pattern should be consistent (at least 40% consistency)",
              "Current date should be within ±3 days of expected next purchase date",
              "Try creating test data with the seed script provided",
            ]
          : [],
    });
  } catch (err) {
    console.error("Debug API error:", err);
    return Response.json(
      { error: "Failed to debug", details: err.message },
      { status: 500 }
    );
  }
}
