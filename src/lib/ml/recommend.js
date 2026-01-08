// src/lib/ml/recommend.js

/**
 * PURE recommendation logic
 * ❌ No DB models
 * ❌ No Next.js APIs
 * ✅ Build-safe
 */

export async function generateRecommendations({
  userId,
  userProfile,
  query,
  seed_product_id,
  top_k = 10,
}) {
  // Placeholder logic (safe for build)
  return {
    recommendations: [],
    user_preferences: userProfile || {},
  };
}

export async function getUserProfile(email) {
  // You already store user preferences elsewhere
  return {
    gender: "male",
    age: 25,
    occupation: "student",
    pets: [],
  };
}
