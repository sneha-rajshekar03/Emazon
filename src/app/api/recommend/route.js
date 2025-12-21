// /app/api/recommend/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/utils/database";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/app/models/User";
import Product from "@/app/models/Product";
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

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

// 🔹 POST - Get personalized recommendations
export async function POST(req) {
  try {
    const { query, category, seed_product_id, top_k = 10 } = await req.json();

    await connectToDB();

    // Get user session
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = userEmail || `guest_${Date.now()}`;

    // Get user profile
    const userProfile = userEmail
      ? await getUserProfile(userEmail)
      : {
          gender: "male",
          age: 25,
          occupation: "student",
          pets: [],
        };

    // Prepare request body for Python API
    const requestBody = {
      user_id: userId,
      top_k: top_k,
      user_profile: userProfile,
      alphas: [0.25, 0.25, 0.2, 0.3],
    };

    // Add query if provided
    if (query) {
      requestBody.query = query;
    }

    // Add seed item index if seed_product_id is provided
    if (seed_product_id) {
      // Note: You might need to map product_id to index in your Python system
      requestBody.seed_item_idx = null; // Add mapping logic if needed
    }

    // Call Python hybrid recommender
    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    // Fetch full product details from MongoDB
    const productIds = recommendations.map((r) => r.id);
    const fullProducts = await Product.find({
      product_id: { $in: productIds },
    }).lean();

    // Create product map
    const productMap = new Map(fullProducts.map((p) => [p.product_id, p]));

    // Merge scores with full product data
    const enrichedProducts = recommendations
      .map((rec) => {
        const fullProd = productMap.get(rec.id);
        if (!fullProd) return null;

        return {
          ...fullProd,
          final_score: rec.final_score,
          preference_score: rec.preference_score,
          initial_score: rec.initial_score,
        };
      })
      .filter((p) => p !== null);

    return NextResponse.json({
      success: true,
      recommendations: enrichedProducts,
      user_preferences: data.user_preferences,
      query: query || null,
      category: category || null,
    });
  } catch (error) {
    console.error("Recommendation API error:", error);
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

// 🔹 GET - Get general recommendations for user
export async function GET(req) {
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

    const userId = userEmail;
    const userProfile = await getUserProfile(userEmail);

    // Get general recommendations without query
    const response = await fetch(`${PYTHON_API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        top_k: 20,
        user_profile: userProfile,
        alphas: [0.25, 0.25, 0.2, 0.3],
      }),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    // Fetch full product details
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
      .filter((p) => p !== null);

    return NextResponse.json({
      success: true,
      recommendations: enrichedProducts,
      user_preferences: data.user_preferences,
    });
  } catch (error) {
    console.error("GET recommendations error:", error);
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
