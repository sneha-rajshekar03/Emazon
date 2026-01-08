import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/app/models/User";
import Product from "@/app/models/Product";

/* 🔒 FORCE RUNTIME (CRITICAL FOR PYTHON CALLS) */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* 🔒 REQUIRE PYTHON API (NO SILENT FALLBACK) */
const PYTHON_API_URL = process.env.PYTHON_API_URL;
if (!PYTHON_API_URL) {
  throw new Error("PYTHON_API_URL is not defined");
}

// 🔹 Get user profile from database
async function getUserProfile(email) {
  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
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

// 🔹 POST - Personalized recommendations
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      query,
      category,
      preferred_category,
      seed_product_id,
      seed_item_idx,
      top_k = 10,
      user_profile: frontendUserProfile,
      alphas,
      is_homepage,
    } = body;

    const finalCategory = preferred_category || category;

    await connectToDB();

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = body.user_id || userEmail || `guest_${Date.now()}`;

    // ✅ Use frontend profile if provided, otherwise fetch from DB
    const userProfile =
      frontendUserProfile ||
      (userEmail
        ? await getUserProfile(userEmail)
        : {
            gender: "male",
            age: 25,
            occupation: "student",
            pets: [],
          });

    // ✅ ENHANCED: Log the profile being used
    console.log("👤 [API] User Profile:", {
      userId,
      gender: userProfile.gender,
      age: userProfile.age,
      pets: userProfile.pets,
      petsCount: userProfile.pets?.length || 0,
    });

    const requestBody = {
      user_id: userId,
      top_k,
      user_profile: userProfile,
      alphas: alphas || [0.25, 0.25, 0.2, 0.3],
    };

    // ✅ Pass all relevant fields to Python
    if (query) requestBody.query = query;
    if (finalCategory) requestBody.preferred_category = finalCategory;
    if (seed_product_id) requestBody.seed_product_id = seed_product_id;
    if (seed_item_idx !== undefined) requestBody.seed_item_idx = seed_item_idx;
    if (is_homepage !== undefined) requestBody.is_homepage = is_homepage;

    console.log("📡 [API] Calling Python recommender:", PYTHON_API_URL);
    console.log("📦 [API] Request summary:", {
      user_id: requestBody.user_id,
      category: finalCategory,
      is_homepage: requestBody.is_homepage,
      has_query: !!requestBody.query,
      alphas: requestBody.alphas,
      pets: userProfile.pets,
    });

    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ [API] Python API error:", text);
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    console.log(
      `✅ [API] Python returned ${recommendations.length} recommendations`
    );

    // ✅ ENHANCED: Log top 3 recommendations with scores
    if (recommendations.length > 0) {
      console.log("🏆 [API] Top 3 from Python:");
      recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. ID: ${rec.id}`);
        console.log(`      Final: ${rec.final_score?.toFixed(4) || "N/A"}`);
        console.log(`      Pref: ${rec.preference_score?.toFixed(4) || "N/A"}`);
        console.log(`      Initial: ${rec.initial_score?.toFixed(4) || "N/A"}`);
      });
    }

    const productIds = recommendations.map((r) => r.id);
    const fullProducts = await Product.find({
      product_id: { $in: productIds },
    }).lean();

    console.log(`📦 [API] Fetched ${fullProducts.length} products from DB`);

    const productMap = new Map(fullProducts.map((p) => [p.product_id, p]));

    const enrichedProducts = recommendations
      .map((rec) => {
        const fullProd = productMap.get(rec.id);
        if (!fullProd) {
          console.warn(`⚠️ [API] Product not found in DB: ${rec.id}`);
          return null;
        }

        return {
          ...fullProd,
          final_score: rec.final_score,
          preference_score: rec.preference_score,
          initial_score: rec.initial_score,
        };
      })
      .filter(Boolean);

    console.log(
      `✅ [API] Returning ${enrichedProducts.length} enriched products`
    );

    // ✅ ENHANCED: Log final top 3 with titles
    if (enrichedProducts.length > 0) {
      console.log("🎯 [API] Final top 3 products:");
      enrichedProducts.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title?.substring(0, 50) || "Unknown"}`);
        console.log(`      Score: ${p.final_score?.toFixed(4) || "N/A"}`);
        console.log(`      Pet: ${p.pet_type || "N/A"}`);
        console.log(`      Cat: ${p.category || "N/A"}`);
      });
    }

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      recommendations: enrichedProducts,
      user_preferences: data.user_preferences,
      query: query || null,
      category: finalCategory || null,
    });
  } catch (error) {
    console.error("❌ [API] Recommendation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recommendations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔹 GET - General recommendations
export async function GET() {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userProfile = await getUserProfile(userEmail);

    console.log("📡 [API/GET] Fetching general recommendations");
    console.log("👤 [API/GET] Profile:", userProfile);

    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userEmail,
        top_k: 20,
        user_profile: userProfile,
        alphas: [0.25, 0.25, 0.2, 0.3],
        is_homepage: false, // ✅ ADDED: Treat GET same as POST
      }),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    console.log(
      `✅ [API/GET] Python returned ${recommendations.length} recommendations`
    );

    const productIds = recommendations.map((r) => r.id);
    const fullProducts = await Product.find({
      product_id: { $in: productIds },
    }).lean();

    const productMap = new Map(fullProducts.map((p) => [p.product_id, p]));

    const enrichedProducts = recommendations
      .map((rec) => {
        const fullProd = productMap.get(rec.id);
        if (!fullProd) return null;

        return {
          ...fullProd,
          final_score: rec.final_score,
          preference_score: rec.preference_score,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      recommendations: enrichedProducts,
      user_preferences: data.user_preferences,
    });
  } catch (error) {
    console.error("❌ [API/GET] GET recommendations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recommendations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
