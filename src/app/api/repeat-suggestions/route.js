// app/api/repeat-suggestions/route.js

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDB } from "@/app/utils/database";
import PurchaseHistory from "@/app/models/PurchaseHistory";
import Product from "@/app/models/Product";
import mongoose from "mongoose";

// ============================================
// DISMISSED SUGGESTION SCHEMA
// ============================================
const DismissedSuggestionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  product_id: {
    type: String,
    required: true,
  },
  dismissed_at: {
    type: Date,
    default: Date.now,
  },
  cycle_start: {
    type: Date,
    required: true,
  },
  cycle_end: {
    type: Date,
    required: true,
    index: true,
  },
  expected_next_date: {
    type: Date,
    required: true,
  },
});

DismissedSuggestionSchema.index({ user_id: 1, product_id: 1, cycle_end: 1 });

const DismissedSuggestion =
  mongoose.models.DismissedSuggestion ||
  mongoose.model("DismissedSuggestion", DismissedSuggestionSchema);

// ============================================
// PATTERN ANALYSIS FUNCTIONS
// ============================================

function analyzeReorderPatterns(purchases) {
  const productPurchases = new Map();

  purchases.forEach((purchase) => {
    purchase.items.forEach((item) => {
      if (!productPurchases.has(item.product_id)) {
        productPurchases.set(item.product_id, []);
      }
      productPurchases.get(item.product_id).push({
        date: new Date(purchase.transaction_date),
        quantity: item.quantity,
      });
    });
  });

  const patterns = [];

  productPurchases.forEach((purchaseHistory, productId) => {
    if (purchaseHistory.length < 2) return;

    purchaseHistory.sort((a, b) => a.date - b.date);

    const intervals = [];
    const quantities = [];

    for (let i = 1; i < purchaseHistory.length; i++) {
      const daysDiff = Math.floor(
        (purchaseHistory[i].date - purchaseHistory[i - 1].date) / 86400000
      );
      intervals.push(daysDiff);
      quantities.push(purchaseHistory[i].quantity);
    }

    // Calculate average quantity
    const avgQuantity = Math.round(
      quantities.reduce((a, b) => a + b, 0) / quantities.length
    );

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - stdDev / avgInterval);

    if (consistency >= 0.4 && avgInterval >= 7 && avgInterval <= 90) {
      patterns.push({
        product_id: productId,
        avgReorderInterval: Math.round(avgInterval),
        avgQuantity: avgQuantity, // ✅ Added typical quantity
        consistency,
        lastPurchaseDate: purchaseHistory[purchaseHistory.length - 1].date,
        lastQuantity: purchaseHistory[purchaseHistory.length - 1].quantity, // ✅ Added last quantity
        purchaseCount: purchaseHistory.length,
        intervals,
        quantities, // ✅ Keep quantity history for reference
      });
    }
  });

  return patterns;
}

function getEligibleReminders(
  patterns,
  cartProductIds,
  today,
  dismissedProducts
) {
  const eligible = [];

  patterns.forEach((pattern) => {
    if (cartProductIds.includes(pattern.product_id)) return;
    if (dismissedProducts.includes(pattern.product_id)) return;

    const daysSinceLastPurchase = Math.floor(
      (today - pattern.lastPurchaseDate) / 86400000
    );

    const expectedNextDate = new Date(pattern.lastPurchaseDate);
    expectedNextDate.setDate(
      expectedNextDate.getDate() + pattern.avgReorderInterval
    );

    const daysUntilExpected = Math.floor((expectedNextDate - today) / 86400000);

    console.log(`[Eligibility Check] ${pattern.product_id}:`, {
      daysSinceLastPurchase,
      avgInterval: pattern.avgReorderInterval,
      avgQuantity: pattern.avgQuantity,
      daysUntilExpected,
      expectedNextDate: expectedNextDate.toISOString(),
      inWindow: daysUntilExpected >= -3 && daysUntilExpected <= 3,
    });

    if (daysUntilExpected >= -3 && daysUntilExpected <= 3) {
      const proximityScore = 1 - Math.abs(daysUntilExpected) / 3;
      const purchaseCountScore = Math.min(pattern.purchaseCount / 5, 1);
      const confidence =
        pattern.consistency * 0.5 +
        purchaseCountScore * 0.3 +
        proximityScore * 0.2;

      eligible.push({
        ...pattern,
        expectedNextDate,
        confidence: Math.min(confidence, 1),
        daysUntilExpected,
      });
    }
  });

  return eligible;
}

function prioritizePatterns(eligible) {
  return eligible.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence;
    }
    return Math.abs(a.daysUntilExpected) - Math.abs(b.daysUntilExpected);
  });
}

// ============================================
// HELPER: ENSURE PRICE IS A NUMBER
// ============================================
function ensurePrice(price) {
  if (price === null || price === undefined) {
    console.warn("[API] ⚠️ Price is null/undefined");
    return 0;
  }

  // Handle Mongoose Decimal128
  if (price.$numberDecimal) {
    return parseFloat(price.$numberDecimal);
  }

  // Handle string or number
  const parsed = parseFloat(price);
  if (isNaN(parsed)) {
    console.warn("[API] ⚠️ Invalid price value:", price);
    return 0;
  }

  return parsed;
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function GET(request) {
  try {
    console.log("\n=== REPEAT SUGGESTIONS API START ===");

    const session = await getServerSession(authOptions);
    console.log("[API] Session user:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("[API] ❌ No session - returning 401");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const { searchParams } = new URL(request.url);
    const cartProductIds = JSON.parse(
      searchParams.get("cartProductIds") || "[]"
    );
    console.log("[API] Cart product IDs:", cartProductIds);

    const purchases = await PurchaseHistory.find({
      user_id: session.user.id,
      status: "completed",
    })
      .select("transaction_date items")
      .sort({ transaction_date: 1 })
      .lean();

    console.log("[API] Found", purchases.length, "completed purchases");

    if (purchases.length < 2) {
      console.log("[API] Not enough purchase history");
      return Response.json({ suggestions: [] });
    }

    const patterns = analyzeReorderPatterns(purchases);
    console.log("[API] Analyzed", patterns.length, "reorder patterns");

    const today = new Date();
    console.log("[API] Using date:", today.toISOString());

    const dismissed = await DismissedSuggestion.find({
      user_id: session.user.id,
      cycle_end: { $gte: today },
    })
      .select("product_id")
      .lean();

    const dismissedProductIds = dismissed.map((d) => d.product_id);
    console.log("[API] Dismissed products:", dismissedProductIds);

    const eligible = getEligibleReminders(
      patterns,
      cartProductIds,
      today,
      dismissedProductIds
    );

    console.log("[API] Eligible suggestions:", eligible.length);

    if (!eligible.length) {
      console.log("[API] No eligible suggestions");
      return Response.json({ suggestions: [] });
    }

    const prioritized = prioritizePatterns(eligible);

    // ============================================
    // FETCH PRODUCT DETAILS - HANDLES BOTH _id AND product_id
    // ✅ FIXED: Now fetches imgUrl instead of image
    // ============================================
    const productIds = prioritized.map((p) => p.product_id);
    console.log("[API] Looking for products:", productIds);

    // Try with product_id field first
    let products = await Product.find({
      product_id: { $in: productIds },
    })
      .select("product_id title price category imgUrl")
      .lean();

    console.log("[API] Found by product_id field:", products.length);

    // If not found, try with _id (MongoDB default)
    if (products.length === 0) {
      console.log("[API] Trying to find by _id instead...");

      // Filter valid ObjectIds
      const validIds = productIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      console.log("[API] Valid ObjectIds:", validIds.length);

      if (validIds.length > 0) {
        products = await Product.find({
          _id: { $in: validIds },
        })
          .select("_id title price category imgUrl")
          .lean();

        console.log("[API] Found by _id:", products.length);

        // Convert _id to product_id for consistency
        products = products.map((p) => ({
          product_id: p._id.toString(),
          title: p.title,
          price: p.price,
          category: p.category,
          imgUrl: p.imgUrl,
        }));
      }
    }

    if (products.length === 0) {
      console.log("[API] ❌ NO PRODUCTS FOUND!");
      console.log("[API] Searched for:", productIds);
      console.log(
        "[API] Make sure these products exist in your Products collection"
      );
      return Response.json({ suggestions: [] });
    }

    const productMap = new Map(products.map((p) => [p.product_id, p]));

    const suggestions = prioritized
      .map((p) => {
        const product = productMap.get(p.product_id);
        if (!product) {
          console.log("[API] ⚠️ Product not found:", p.product_id);
          return null;
        }

        // CRITICAL FIX: Ensure price is a valid number
        const price = ensurePrice(product.price);

        console.log(
          "[API] Product:",
          p.product_id,
          "| Raw price:",
          product.price,
          "| Parsed price:",
          price,
          "| Avg Quantity:",
          p.avgQuantity,
          "| Image URL:",
          product.imgUrl
        );

        return {
          product_id: p.product_id,
          title: product.title || "Unknown Product",
          price: price,
          category: product.category || "Uncategorized",
          image: product.imgUrl || null,
          avgReorderInterval: p.avgReorderInterval,
          suggestedQuantity: p.avgQuantity, // ✅ Added suggested quantity
          lastQuantity: p.lastQuantity, // ✅ Added last ordered quantity
          confidence: p.confidence,
          expectedNextDate: p.expectedNextDate,
          lastPurchasedDays: Math.floor(
            (today - p.lastPurchaseDate) / 86400000
          ),
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    console.log(
      "[API] ✓ Returning",
      suggestions.length,
      "suggestions:",
      suggestions.map(
        (s) => `${s.product_id} ($${s.price} x${s.suggestedQuantity})`
      )
    );
    console.log("=== REPEAT SUGGESTIONS API END ===\n");

    return Response.json({ suggestions });
  } catch (err) {
    console.error("[API] ❌ Error:", err);
    return Response.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
