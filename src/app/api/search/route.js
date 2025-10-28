// /app/api/search/route.js
import { NextResponse } from "next/server";
import fuzzysort from "fuzzysort";
import { getServerSession } from "next-auth";
import { connectToDB } from "@app/utils/database";
import SearchHistory from "@app/models/SearchHistory";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import Product from "@app/models/Product";
import User from "@app/models/User";

// 🔹 Configuration for Python API
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// 🔹 normalize query & strings (handles plural/singular)
function normalize(str) {
  return str.toLowerCase().trim().replace(/s$/, ""); // strip trailing 's'
}

// 🔹 Helper function to save search history (with deduplication)
async function saveSearchHistory(userEmail, query, category, source) {
  if (!userEmail) return;

  try {
    const normalizedQuery = query.trim();

    // Remove any existing search with the same query (case-insensitive)
    await SearchHistory.findOneAndDelete({
      email: userEmail,
      query: {
        $regex: new RegExp(
          `^${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    // Create new search entry (will be most recent)
    await SearchHistory.create({
      userId: userEmail,
      query: normalizedQuery,
      email: userEmail,
      category: category || "Mixed",
      source: source || "mongodb",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error saving search history:", error);
  }
}

// 🔹 Call Python hybrid recommender API
async function getHybridRecommendations(userId, query, userProfile) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        query: query,
        top_k: 20,
        user_profile: userProfile,
        alphas: [0.25, 0.25, 0.2, 0.3], // search, NCF, content, preference
      }),
    });

    if (!response.ok) {
      console.error("Python API error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Error calling Python API:", error);
    return null;
  }
}

// 🔹 Record user interaction with product
async function recordInteraction(userId, product) {
  try {
    await fetch(`${PYTHON_API_URL}/user/interaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: product.product_id || product.id,
        title: product.title,
        category: product.category_name || product.category,
        price: product.price,
        stars: product.stars,
        seller_name: product.seller_name,
      }),
    });
  } catch (error) {
    console.error("Error recording interaction:", error);
  }
}

// 🔹 Get user profile from database
async function getUserProfile(email) {
  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      // Return default profile for new users
      return {
        gender: "male",
        age: 25,
        occupation: "student",
        pets: [],
      };
    }

    return {
      gender: user.gender || "male",
      age: user.age || 25,
      occupation: user.occupation || "student",
      pets: user.pets || [],
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      gender: "male",
      age: 25,
      occupation: "student",
      pets: [],
    };
  }
}

// 🔹 Fallback to MongoDB search if Python API fails
async function mongoFallbackSearch(query) {
  const q = normalize(query);

  // Step 1: Direct category match
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

  // Step 2: Narrow down candidates with Mongo regex
  const candidates = await Product.find(
    {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { category_name: { $regex: q, $options: "i" } },
      ],
    },
    "title category_name product_id imgUrl price stars seller_name"
  ).lean();

  // Step 3: Fuzzy search on narrowed candidates
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

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ valid: false, products: [] });
    }

    // ✅ Connect to MongoDB
    await connectToDB();

    // Get user session
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = userEmail || `guest_${Date.now()}`;

    // Get user profile for personalized recommendations
    let userProfile = null;
    if (userEmail) {
      userProfile = await getUserProfile(userEmail);
    }

    // 🔹 Try hybrid recommender first (if user profile exists)
    let hybridResults = null;
    if (userProfile) {
      hybridResults = await getHybridRecommendations(
        userId,
        query,
        userProfile
      );
    }

    // 🔹 If hybrid recommender returns results, use them
    if (hybridResults && hybridResults.length > 0) {
      // Map Python API results to MongoDB format
      const productIds = hybridResults.map((r) => r.id);

      // Fetch full product details from MongoDB
      const fullProducts = await Product.find({
        product_id: { $in: productIds },
      }).lean();

      // Create a map for quick lookup
      const productMap = new Map(fullProducts.map((p) => [p.product_id, p]));

      // Merge hybrid scores with full product data, preserving order
      const enrichedProducts = hybridResults
        .map((hybridProd) => {
          const fullProd = productMap.get(hybridProd.id);
          if (!fullProd) return null;

          return {
            ...fullProd,
            final_score: hybridProd.final_score,
            preference_score: hybridProd.preference_score,
            initial_score: hybridProd.initial_score,
          };
        })
        .filter((p) => p !== null);

      // Save to search history (with deduplication)
      await saveSearchHistory(
        userEmail,
        query,
        enrichedProducts[0]?.category_name || "Mixed",
        "hybrid_recommender"
      );

      return NextResponse.json({
        valid: true,
        type: "hybrid",
        products: enrichedProducts.slice(0, 20),
        source: "hybrid_recommender",
        user_preferences: hybridResults.user_preferences || null,
      });
    }

    // 🔹 Fallback to MongoDB search
    console.log("Falling back to MongoDB search");
    const fallbackResults = await mongoFallbackSearch(query);

    // Save to search history (with deduplication)
    if (fallbackResults.valid) {
      await saveSearchHistory(
        userEmail,
        query,
        fallbackResults.category ||
          fallbackResults.products[0]?.category_name ||
          "Mixed",
        "mongodb"
      );
    }

    return NextResponse.json(fallbackResults);
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({
      valid: false,
      products: [],
      error: "Server error",
    });
  }
}

// 🔹 GET endpoint to check Python API health
export async function GET(req) {
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
