// /app/api/search/route.js
import { NextResponse } from "next/server";
import fuzzysort from "fuzzysort";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/utils/database";
import SearchHistory from "@/app/models/SearchHistory";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Product from "@/app/models/product";
import User from "@/app/models/User";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// ==========================================
// 🔹 Utility Helpers
// ==========================================

// Normalize queries (handle plural/singular)
function normalize(str) {
  return str.toLowerCase().trim().replace(/s$/, "");
}

// Save search history with deduplication + frequency tracking
async function saveSearchHistory(
  userEmail,
  query,
  category,
  source,
  resultsCount = 0
) {
  if (!userEmail) return;

  try {
    const normalizedQuery = query.trim();

    const existingSearch = await SearchHistory.findOne({
      email: userEmail,
      query: {
        $regex: new RegExp(
          `^${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    if (existingSearch) {
      await SearchHistory.findByIdAndUpdate(existingSearch._id, {
        $inc: { searchCount: 1 },
        $set: {
          category: category || "Mixed",
          source: source || "mongodb",
          resultsCount,
          lastSearchedAt: new Date(),
          searchedAt: new Date(),
        },
      });
    } else {
      await SearchHistory.create({
        userId: userEmail,
        query: normalizedQuery,
        email: userEmail,
        category: category || "Mixed",
        source: source || "mongodb",
        searchCount: 1,
        resultsCount,
        searchedAt: new Date(),
        lastSearchedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error saving search history:", error);
  }
}

// ==========================================
// 🔹 Recommender & Fallback Search Logic
// ==========================================

async function getHybridRecommendations(userId, query, userProfile) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        query,
        top_k: 20,
        user_profile: userProfile,
        alphas: [0.25, 0.25, 0.2, 0.3],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Error calling Python API:", error);
    return null;
  }
}

async function mongoFallbackSearch(query) {
  const q = normalize(query);
  const categories = await Product.distinct("category_name");
  const direct = categories.find((cat) => normalize(cat).includes(q));

  if (direct) {
    const productsInCat = await Product.find({
      category_name: new RegExp(`^${direct}$`, "i"),
    }).lean();

    return {
      valid: true,
      type: "category",
      category: direct,
      products: productsInCat.slice(0, 20),
      source: "mongodb",
    };
  }

  const candidates = await Product.find(
    {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { category_name: { $regex: q, $options: "i" } },
      ],
    },
    "title category_name product_id imgUrl price stars seller_name"
  ).lean();

  const results = fuzzysort.go(q, candidates, {
    key: "title",
    limit: 20,
    threshold: -100,
  });

  const matchedProducts = results.map((r) => r.obj);
  if (matchedProducts.length > 0) {
    return {
      valid: true,
      type: "products",
      products: matchedProducts,
      source: "mongodb",
    };
  }

  return { valid: false, products: [], source: "mongodb" };
}

// ==========================================
// 🔹 POST — Main search handler
// ==========================================
export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ valid: false, products: [] });
    }

    await connectToDB();

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = userEmail || `guest_${Date.now()}`;

    // Fetch user profile for personalized hybrid search
    let userProfile = null;
    if (userEmail) {
      const user = await User.findOne({ email: userEmail }).lean();
      userProfile = {
        gender: user?.gender || "male",
        age: user?.age || 25,
        occupation: user?.occupation || "student",
        pets: user?.pets || [],
      };
    }

    // Hybrid recommender first
    let hybridResults = userProfile
      ? await getHybridRecommendations(userId, query, userProfile)
      : null;

    if (hybridResults && hybridResults.length > 0) {
      const productIds = hybridResults.map((r) => r.id);
      const fullProducts = await Product.find({
        product_id: { $in: productIds },
      }).lean();

      const productMap = new Map(fullProducts.map((p) => [p.product_id, p]));

      const enrichedProducts = hybridResults
        .map((r) => ({ ...productMap.get(r.id), ...r }))
        .filter(Boolean);

      await saveSearchHistory(
        userEmail,
        query,
        enrichedProducts[0]?.category_name || "Mixed",
        "hybrid_recommender",
        enrichedProducts.length
      );

      return NextResponse.json({
        valid: true,
        type: "hybrid",
        products: enrichedProducts.slice(0, 20),
        source: "hybrid_recommender",
        resultsCount: enrichedProducts.length,
      });
    }

    // Fallback to MongoDB search
    const fallbackResults = await mongoFallbackSearch(query);

    if (fallbackResults.valid) {
      await saveSearchHistory(
        userEmail,
        query,
        fallbackResults.category ||
          fallbackResults.products[0]?.category_name ||
          "Mixed",
        "mongodb",
        fallbackResults.products.length
      );
    } else {
      await saveSearchHistory(userEmail, query, "No Results", "mongodb", 0);
    }

    return NextResponse.json({
      ...fallbackResults,
      resultsCount: fallbackResults.products.length,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({
      valid: false,
      products: [],
      error: "Server error",
    });
  }
}

// ==========================================
// 🔹 GET — With search history support
// ==========================================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const historyMode = searchParams.get("history");

  // ✅ 1. Handle /api/search?history=true
  if (historyMode === "true") {
    try {
      await connectToDB();

      // 🔐 CRITICAL: Check user authentication
      const session = await getServerSession(authOptions);
      const userEmail = session?.user?.email;

      // If no user is logged in, return empty array
      if (!userEmail) {
        console.log(
          "📭 [API] No authenticated user - returning empty search history"
        );
        return NextResponse.json([], { status: 200 });
      }

      console.log(`🔍 [API] Fetching search history for user: ${userEmail}`);

      // Fetch only THIS USER's recent 10 entries, newest first
      const recent = await SearchHistory.find({ email: userEmail })
        .sort({ searchedAt: -1 })
        .limit(10)
        .select("category query searchedAt -_id");

      console.log(
        `✅ [API] Returning ${recent.length} search history items for ${userEmail}`
      );

      // Return directly usable JSON for hero banner
      return NextResponse.json(recent || [], { status: 200 });
    } catch (error) {
      console.error("❌ [API] Error fetching search history:", error);
      return NextResponse.json([], { status: 500 });
    }
  }

  // ✅ 2. Otherwise, return Python API health status
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`);
    const data = await response.json();

    return NextResponse.json({
      pythonApiStatus: response.ok ? "healthy" : "unhealthy",
      pythonApiDetails: data,
    });
  } catch (error) {
    return NextResponse.json({
      pythonApiStatus: "unreachable",
      error: error.message,
    });
  }
}
