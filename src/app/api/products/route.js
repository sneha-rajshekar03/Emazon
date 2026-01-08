// app/api/products/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDB } from "@/app/utils/database";
import Product from "@/app/models/Product";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

function deduplicateProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    const id = product.product_id;
    if (seen.has(id)) {
      console.warn(`⚠️ Duplicate product removed: ${id}`);
      return false;
    }
    seen.add(id);
    return true;
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query");
    const limit = searchParams.get("limit") || "20";
    const sortBy = searchParams.get("sort_by") || "relevance";

    // Get user ID from cookies or session
    const cookieStore = cookies();
    const userId = cookieStore.get("user_id")?.value || null;

    let apiUrl;

    // Determine which ML endpoint to use
    if (query) {
      // Search endpoint
      apiUrl = `${ML_API_URL}/products/search?query=${encodeURIComponent(
        query
      )}&limit=${limit}`;
      if (category) {
        apiUrl += `&category=${encodeURIComponent(category)}`;
      }
    } else if (category) {
      // Category endpoint with personalization
      apiUrl = `${ML_API_URL}/products/category/${encodeURIComponent(
        category
      )}?limit=${limit}&sort_by=${sortBy}`;
      if (userId) {
        apiUrl += `&user_id=${userId}`;
      }
    } else {
      // General recommendations endpoint
      apiUrl = `${ML_API_URL}/products/recommended?limit=${limit}`;
      if (userId) {
        apiUrl += `&user_id=${userId}`;
      }
    }

    console.log("🔍 Fetching product IDs from ML model:", apiUrl);

    let mlData;
    try {
      // Step 1: Get product IDs and scores from ML model
      const mlResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 ML API response status:", mlResponse.status);

      if (!mlResponse.ok) {
        console.error("⚠️ ML API returned error status:", mlResponse.status);
        throw new Error(`ML API returned ${mlResponse.status}`);
      }

      mlData = await mlResponse.json();
      console.log("✅ ML API response received:", {
        hasProducts: !!mlData.products,
        productCount: mlData.products?.length || 0,
      });
    } catch (mlError) {
      console.error("⚠️ ML API failed, using fallback:", mlError.message);
      // Fall back to MongoDB without ML scores
      await connectToDB();

      let products;
      if (category) {
        products = await Product.find({
          category_name: { $regex: category, $options: "i" },
        })
          .limit(parseInt(limit))
          .lean();
      } else if (query) {
        products = await Product.find({
          $or: [
            { title: { $regex: query, $options: "i" } },
            { category_name: { $regex: query, $options: "i" } },
          ],
        })
          .limit(parseInt(limit))
          .lean();
      } else {
        products = await Product.find({}).limit(parseInt(limit)).lean();
      }

      // Convert _id to string
      products = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      console.log(`🔄 Fallback returned ${products.length} products`);

      return NextResponse.json({
        success: true,
        products: products,
        total: products.length,
        personalized: false,
        fallback: true,
        message: "Using database fallback (ML model unavailable)",
      });
    }

    // Check if ML returned empty results
    if (!mlData.products || mlData.products.length === 0) {
      console.log("⚠️ ML returned no products, using fallback");

      await connectToDB();
      let products;

      if (category) {
        products = await Product.find({
          category_name: { $regex: category, $options: "i" },
        })
          .limit(parseInt(limit))
          .lean();
      } else if (query) {
        products = await Product.find({
          $or: [
            { title: { $regex: query, $options: "i" } },
            { category_name: { $regex: query, $options: "i" } },
          ],
        })
          .limit(parseInt(limit))
          .lean();
      } else {
        products = await Product.find({}).limit(parseInt(limit)).lean();
      }

      products = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        products: products,
        total: products.length,
        personalized: false,
        fallback: true,
        message: "No ML recommendations, showing general results",
      });
    }

    console.log(`✅ ML model returned ${mlData.products.length} product IDs`);

    // Step 2: Extract product IDs from ML results
    const productIds = mlData.products.map((p) => p.product_id || p.id);

    // Create a map of product_id -> ML scores for later merging
    const mlScoresMap = {};
    mlData.products.forEach((p) => {
      const id = p.product_id || p.id;
      mlScoresMap[id] = {
        relevance_score:
          p.relevance_score ||
          p.recommendation_score ||
          p.similarity_score ||
          0,
        recommendation_score: p.recommendation_score || 0,
        preference_score: p.preference_score || 0,
        suitability_score: p.suitability_score || 0,
        rank: p.rank || 0,
      };
    });

    console.log("📦 Fetching full product details from MongoDB...");

    // Step 3: Connect to MongoDB and fetch full product details
    await connectToDB();

    const fullProducts = await Product.find({
      product_id: { $in: productIds },
    }).lean();

    console.log(`✅ MongoDB returned ${fullProducts.length} full products`);

    // Step 4: Merge ML scores with MongoDB data and maintain ML ranking order
    const productMap = {};
    fullProducts.forEach((product) => {
      productMap[product.product_id] = product;
    });

    const mergedProducts = productIds
      .map((productId) => {
        const mongoProduct = productMap[productId];
        const mlScores = mlScoresMap[productId];

        if (!mongoProduct) {
          console.warn(`⚠️ Product ${productId} not found in MongoDB`);
          return null;
        }

        return {
          ...mongoProduct,
          ml_scores: mlScores,
          _id: mongoProduct._id.toString(),
        };
      })
      .filter((p) => p !== null);

    // CRITICAL FIX: Final deduplication
    const finalProducts = deduplicateProducts(mergedProducts);

    console.log(
      `🎯 Final result: ${
        finalProducts.length
      } products with ML scores (removed ${
        mergedProducts.length - finalProducts.length
      } duplicates)`
    );

    return NextResponse.json({
      success: true,
      products: finalProducts,
      total: finalProducts.length,
      personalized: mlData.personalized || false,
      category: category,
      query: query,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);

    // Ultimate fallback to MongoDB-only if everything fails
    try {
      console.log("⚠️ Critical error, using final fallback...");
      await connectToDB();

      const { searchParams } = new URL(request.url);
      const category = searchParams.get("category");
      const limit = parseInt(searchParams.get("limit") || "20");

      let products;
      if (category) {
        products = await Product.find({
          category_name: { $regex: category, $options: "i" },
        })
          .limit(limit)
          .lean();
      } else {
        products = await Product.find({}).limit(limit).lean();
      }

      // Convert _id to string
      products = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        products: products,
        total: products.length,
        personalized: false,
        fallback: true,
        message: "Using database fallback (critical error)",
      });
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          products: [],
        },
        { status: 500 }
      );
    }
  }
}

// POST endpoint for personalized recommendations with full profile
export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📥 POST /api/products received body:", body);

    const {
      user_id,
      query,
      preferred_category,
      seed_item_idx,
      top_k = 20,
      user_profile,
      alphas = [0.25, 0.25, 0.2, 0.3],
    } = body;

    // ✅ CRITICAL: Determine if this is a homepage request
    const isHomepage = !query && !!preferred_category;

    console.log("🎯 Request mode detection:", {
      query: query,
      preferred_category: preferred_category,
      is_homepage: isHomepage,
      user_gender: user_profile?.gender,
      user_pets: user_profile?.pets,
    });

    // Use the main recommend endpoint with full profile
    const apiUrl = `${ML_API_URL}/recommend`;

    // ✅ CRITICAL: Include is_homepage flag in payload
    const requestBody = {
      user_id: user_id || "guest_user",
      query: query || null,
      preferred_category: preferred_category || null,
      seed_item_idx: seed_item_idx !== undefined ? seed_item_idx : null,
      top_k: top_k,
      user_profile: {
        gender: user_profile?.gender || "female",
        age: user_profile?.age || 25,
        occupation: user_profile?.occupation || "professional",
        pets: user_profile?.pets || [],
      },
      alphas: alphas,
      is_homepage: isHomepage, // ✅ ADD THIS LINE
    };

    console.log("🎯 Sending to ML API:", apiUrl);
    console.log("📤 Request payload:", JSON.stringify(requestBody, null, 2));

    let mlData;
    try {
      // Step 1: Get recommendations from ML model
      const mlResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 ML API response status:", mlResponse.status);
      console.log("📥 ML API response OK:", mlResponse.ok);

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error("❌ ML API error response:", errorText);
        throw new Error(`ML API returned ${mlResponse.status}`);
      }

      mlData = await mlResponse.json();
      console.log("✅ ML API response received");
      console.log("📊 ML response structure:", {
        hasRecommendations: !!mlData.recommendations,
        recommendationsCount: mlData.recommendations?.length || 0,
        hasUserPreferences: !!mlData.user_preferences,
      });
    } catch (mlError) {
      console.error("⚠️ ML API failed:", mlError.message);

      // Fallback for POST requests
      await connectToDB();
      const products = await Product.find({}).limit(top_k).lean();

      const fallbackProducts = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        products: fallbackProducts,
        total: fallbackProducts.length,
        user_preferences: null,
        personalized: false,
        fallback: true,
        message: "Using database fallback for personalized request",
      });
    }

    if (!mlData.recommendations || mlData.recommendations.length === 0) {
      console.log("⚠️ No recommendations in ML response, using fallback");

      await connectToDB();
      const products = await Product.find({}).limit(top_k).lean();

      const fallbackProducts = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        products: fallbackProducts,
        total: fallbackProducts.length,
        user_preferences: mlData.user_preferences,
        personalized: false,
        fallback: true,
        message: "No ML recommendations, showing general results",
      });
    }

    // Step 2: Extract product IDs
    const productIds = mlData.recommendations.map((p) => p.id);
    console.log(
      "📋 Product IDs to fetch from MongoDB:",
      productIds.slice(0, 5),
      `... (${productIds.length} total)`
    );

    // Create scores map
    const mlScoresMap = {};
    mlData.recommendations.forEach((p, index) => {
      mlScoresMap[p.id] = {
        final_score: p.final_score || 0,
        initial_score: p.initial_score || 0,
        suitability_score: p.suitability_score || 0,
        preference_score: p.preference_score || 0,
        rank: index + 1,
      };
    });

    console.log("📦 Fetching full product details from MongoDB...");

    // Step 3: Get full details from MongoDB
    await connectToDB();

    const fullProducts = await Product.find({
      product_id: { $in: productIds },
    }).lean();

    console.log(`✅ MongoDB returned ${fullProducts.length} products`);

    // Step 4: Merge and maintain order
    const productMap = {};
    fullProducts.forEach((product) => {
      productMap[product.product_id] = product;
    });

    const mergedProducts = productIds
      .map((productId) => {
        const mongoProduct = productMap[productId];
        const mlScores = mlScoresMap[productId];

        if (!mongoProduct) {
          console.warn(`⚠️ Product ${productId} not found in MongoDB`);
          return null;
        }

        return {
          ...mongoProduct,
          ml_scores: mlScores,
          _id: mongoProduct._id.toString(),
        };
      })
      .filter((p) => p !== null);

    console.log(`🔗 Merged ${mergedProducts.length} products with ML scores`);

    // CRITICAL FIX: Final deduplication
    const finalProducts = deduplicateProducts(mergedProducts);

    console.log(
      `🎯 Final result: ${finalProducts.length} unique products (removed ${
        mergedProducts.length - finalProducts.length
      } duplicates)`
    );

    return NextResponse.json({
      success: true,
      products: finalProducts,
      total: finalProducts.length,
      user_preferences: mlData.user_preferences,
      personalized: true,
    });
  } catch (error) {
    console.error("❌ Error fetching personalized recommendations:", error);
    console.error("❌ Error stack:", error.stack);

    // Final fallback
    try {
      await connectToDB();
      const products = await Product.find({}).limit(20).lean();

      const fallbackProducts = products.map((p) => ({
        ...p,
        _id: p._id.toString(),
      }));

      return NextResponse.json({
        success: true,
        products: fallbackProducts,
        total: fallbackProducts.length,
        user_preferences: null,
        personalized: false,
        fallback: true,
        error: error.message,
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
          products: [],
        },
        { status: 500 }
      );
    }
  }
}
