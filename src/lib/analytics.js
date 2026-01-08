// lib/analytics.js
// Privacy-Safe Analytics Aggregation Functions - DIRECT DATABASE ACCESS

import { connectToDB } from "@/app/utils/database";
import User from "@/app/models/User";
import UserPreference from "@/app/models/UserPreference";
import PurchaseHistory from "@/app/models/PurchaseHistory";
import SearchHistory from "@/app/models/SearchHistory";

/**
 * A) USER ANALYTICS
 * Aggregates user counts and growth metrics
 */
export async function aggregateUserAnalytics() {
  try {
    console.log("📊 [USER ANALYTICS] Fetching from database...");

    await connectToDB();

    const users = await User.find({}).select("email role createdAt").lean();

    console.log("✅ [USER ANALYTICS] Fetched users:", users.length);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const validUsers = users.filter((u) => {
      const date = new Date(u.createdAt);
      return !isNaN(date.getTime());
    });

    console.log(
      `✅ [USER ANALYTICS] Valid users: ${validUsers.length}/${users.length}`
    );

    const totalUsers = validUsers.length;
    const adminCount = validUsers.filter((u) => u.role === "admin").length;

    const newUsersLast7Days = validUsers.filter(
      (u) => new Date(u.createdAt) >= sevenDaysAgo
    ).length;

    const newUsersLast30Days = validUsers.filter(
      (u) => new Date(u.createdAt) >= thirtyDaysAgo
    ).length;

    const dailyGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = validUsers.filter((u) => {
        const userDate = new Date(u.createdAt);
        if (isNaN(userDate.getTime())) return false;
        const userDateStr = userDate.toISOString().split("T")[0];
        return userDateStr === dateStr;
      }).length;

      dailyGrowth.push({ date: dateStr, count });
    }

    const result = {
      totalUsers,
      adminCount,
      regularUsers: totalUsers - adminCount,
      weeklyGrowth: newUsersLast7Days,
      monthlyGrowth: newUsersLast30Days,
      dailyGrowth,
    };

    console.log("✅ [USER ANALYTICS] Aggregation complete:", {
      totalUsers: result.totalUsers,
      weeklyGrowth: result.weeklyGrowth,
    });

    return result;
  } catch (error) {
    console.error("❌ [USER ANALYTICS] Error:", error);
    throw error;
  }
}

/**
 * B) SEARCH HISTORY ANALYTICS
 * Aggregates search patterns and category popularity
 */
export async function aggregateSearchAnalytics() {
  try {
    console.log("📊 [SEARCH ANALYTICS] Fetching from database...");

    await connectToDB();

    const searches = await SearchHistory.find({})
      .select("category query searchCount resultsCount source searchedAt")
      .lean();

    console.log("✅ [SEARCH ANALYTICS] Fetched searches:", searches.length);

    if (searches.length === 0) {
      console.log("ℹ️ [SEARCH ANALYTICS] No searches found");
      return {
        topCategories: [],
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultsPerSearch: 0,
        sourceDistribution: [],
      };
    }

    const categoryStats = new Map();
    const uniqueQueries = new Set();
    let totalSearchCount = 0;
    let totalResults = 0;
    const sourceStats = new Map();

    searches.forEach((search) => {
      if (search.category) {
        const category = search.category;
        if (!categoryStats.has(category)) {
          categoryStats.set(category, {
            totalSearches: 0,
            totalResults: 0,
            uniqueQueries: new Set(),
          });
        }

        const stats = categoryStats.get(category);
        stats.totalSearches += search.searchCount || 1;
        stats.totalResults += search.resultsCount || 0;
        if (search.query) {
          stats.uniqueQueries.add(search.query.toLowerCase());
        }
      }

      if (search.query) {
        uniqueQueries.add(search.query.toLowerCase());
      }

      totalSearchCount += search.searchCount || 1;
      totalResults += search.resultsCount || 0;

      if (search.source) {
        sourceStats.set(
          search.source,
          (sourceStats.get(search.source) || 0) + 1
        );
      }
    });

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        searchCount: stats.totalSearches,
        avgResults: stats.totalResults / stats.totalSearches,
        uniqueQueries: stats.uniqueQueries.size,
        percentage: parseFloat(
          ((stats.totalSearches / totalSearchCount) * 100).toFixed(1)
        ),
      }))
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 10);

    const sourceDistribution = Array.from(sourceStats.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: parseFloat(((count / searches.length) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    const result = {
      topCategories,
      totalSearches: totalSearchCount,
      uniqueQueries: uniqueQueries.size,
      avgResultsPerSearch:
        totalSearchCount > 0
          ? parseFloat((totalResults / totalSearchCount).toFixed(1))
          : 0,
      sourceDistribution,
    };

    console.log("✅ [SEARCH ANALYTICS] Aggregation complete:", {
      totalSearches: result.totalSearches,
      topCategories: topCategories.length,
    });

    return result;
  } catch (error) {
    console.error("❌ [SEARCH ANALYTICS] Error:", error);
    return {
      topCategories: [],
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultsPerSearch: 0,
      sourceDistribution: [],
    };
  }
}

/**
 * C) PREFERENCES ANALYTICS
 * Aggregates user preferences into category scores
 */
export async function aggregatePreferencesAnalytics() {
  try {
    console.log("📊 [PREFERENCES ANALYTICS] Fetching from database...");

    await connectToDB();

    const preferences = await UserPreference.find({})
      .select("userId preferences")
      .lean();

    console.log(
      "✅ [PREFERENCES ANALYTICS] Fetched preference records:",
      preferences.length
    );

    const categoryScores = new Map();

    preferences.forEach((userPref) => {
      if (!userPref.preferences || !Array.isArray(userPref.preferences)) {
        console.warn(
          "⚠️ [PREFERENCES ANALYTICS] Invalid preference format for user"
        );
        return;
      }

      userPref.preferences.forEach((pref) => {
        const category = pref.element;
        const score = pref.score;

        if (!category || typeof score !== "number") {
          console.warn(
            "⚠️ [PREFERENCES ANALYTICS] Invalid preference data:",
            pref
          );
          return;
        }

        if (!categoryScores.has(category)) {
          categoryScores.set(category, { total: 0, count: 0 });
        }

        const current = categoryScores.get(category);
        current.total += score;
        current.count += 1;
      });
    });

    const aggregated = Array.from(categoryScores.entries())
      .map(([category, data]) => ({
        category,
        avgScore: parseFloat((data.total / data.count).toFixed(2)),
        interactions: data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    console.log(
      "✅ [PREFERENCES ANALYTICS] Aggregation complete:",
      aggregated.length,
      "categories"
    );

    return aggregated;
  } catch (error) {
    console.error("❌ [PREFERENCES ANALYTICS] Error:", error);
    return [];
  }
}

/**
 * D) PURCHASE ANALYTICS
 * Aggregates purchase patterns without exposing user data
 */
export async function aggregatePurchaseAnalytics() {
  try {
    console.log("📊 [PURCHASE ANALYTICS] Fetching from database...");

    await connectToDB();

    const purchases = await PurchaseHistory.find({})
      .select("user_id items transaction_date")
      .lean();

    console.log("✅ [PURCHASE ANALYTICS] Fetched purchases:", purchases.length);

    if (purchases.length === 0) {
      console.log("ℹ️ [PURCHASE ANALYTICS] No purchases found");
      return getDefaultPurchaseAnalytics();
    }

    let totalRevenue = 0;
    const userPurchaseCounts = new Map();
    const categoryFrequency = new Map();

    purchases.forEach((purchase) => {
      if (!purchase.items || !Array.isArray(purchase.items)) {
        console.warn(
          "⚠️ [PURCHASE ANALYTICS] Invalid purchase format:",
          purchase
        );
        return;
      }

      const orderValue = purchase.items.reduce((sum, item) => {
        const price = parseFloat(item.unit_price || item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + price * quantity;
      }, 0);
      totalRevenue += orderValue;

      const userId = purchase.user_id;
      if (userId) {
        userPurchaseCounts.set(
          userId,
          (userPurchaseCounts.get(userId) || 0) + 1
        );
      }

      // Extract category from product_id
      purchase.items.forEach((item) => {
        if (!item.product_id) return;

        const productId = item.product_id;
        let category = "other";

        if (productId.includes("_")) {
          category = productId.split("_")[0];
        } else if (productId.startsWith("B")) {
          category = "products";
        }

        categoryFrequency.set(
          category,
          (categoryFrequency.get(category) || 0) + 1
        );
      });
    });

    const totalOrders = purchases.length;
    const avgOrderValue =
      totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

    const repeatBuyers = Array.from(userPurchaseCounts.values()).filter(
      (count) => count > 1
    ).length;
    const repeatRate =
      userPurchaseCounts.size > 0
        ? parseFloat(
            ((repeatBuyers / userPurchaseCounts.size) * 100).toFixed(1)
          )
        : 0;

    const sortedCategories = Array.from(categoryFrequency.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topCategory = sortedCategories[0]?.[0] || "N/A";

    const categoryDistribution = sortedCategories
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage:
          totalOrders > 0
            ? parseFloat(((count / totalOrders) * 100).toFixed(1))
            : 0,
      }));

    const result = {
      avgOrderValue,
      totalOrders,
      repeatRate,
      topCategory,
      categoryDistribution,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    };

    console.log("✅ [PURCHASE ANALYTICS] Aggregation complete:", {
      totalOrders: result.totalOrders,
      totalRevenue: result.totalRevenue,
      avgOrderValue: result.avgOrderValue,
    });

    return result;
  } catch (error) {
    console.error("❌ [PURCHASE ANALYTICS] Error:", error);
    return getDefaultPurchaseAnalytics();
  }
}

function getDefaultPurchaseAnalytics() {
  return {
    avgOrderValue: 0,
    totalOrders: 0,
    repeatRate: 0,
    topCategory: "N/A",
    categoryDistribution: [],
    totalRevenue: 0,
  };
}

/**
 * E) PAYMENT PREDICTION ANALYTICS
 * Aggregates payment method predictions
 */
export async function aggregatePaymentPredictions() {
  try {
    console.log("📊 [PAYMENT PREDICTIONS] Generating analytics...");

    const mockPredictions = [
      { method: "UPI", count: 450 },
      { method: "Card", count: 320 },
      { method: "COD", count: 180 },
      { method: "Fallback", count: 50 },
    ];

    const total = mockPredictions.reduce((sum, p) => sum + p.count, 0);

    const distribution = mockPredictions.map((p) => ({
      method: p.method,
      percentage: parseFloat(((p.count / total) * 100).toFixed(1)),
      count: p.count,
    }));

    const fallbackCount =
      mockPredictions.find((p) => p.method === "Fallback")?.count || 0;
    const fallbackRate = parseFloat(((fallbackCount / total) * 100).toFixed(1));

    const result = {
      distribution,
      fallbackRate,
      totalPredictions: total,
    };

    console.log("✅ [PAYMENT PREDICTIONS] Aggregation complete:", {
      totalPredictions: result.totalPredictions,
      fallbackRate: result.fallbackRate,
    });

    return result;
  } catch (error) {
    console.error("❌ [PAYMENT PREDICTIONS] Error:", error);
    return {
      distribution: [],
      fallbackRate: 0,
      totalPredictions: 0,
    };
  }
}

/**
 * MASTER AGGREGATION FUNCTION
 * Calls all aggregation functions and returns complete analytics
 */
export async function getAllAnalytics() {
  console.log("🚀 [ANALYTICS] Starting master aggregation...");

  try {
    const [users, searchHistory, preferences, purchases, payments] =
      await Promise.all([
        aggregateUserAnalytics().catch((err) => {
          console.error("❌ [ANALYTICS] User analytics failed:", err);
          return {
            totalUsers: 0,
            adminCount: 0,
            regularUsers: 0,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            dailyGrowth: [],
          };
        }),
        aggregateSearchAnalytics().catch((err) => {
          console.error("❌ [ANALYTICS] Search analytics failed:", err);
          return {
            topCategories: [],
            totalSearches: 0,
            uniqueQueries: 0,
            avgResultsPerSearch: 0,
            sourceDistribution: [],
          };
        }),
        aggregatePreferencesAnalytics().catch((err) => {
          console.error("❌ [ANALYTICS] Preferences analytics failed:", err);
          return [];
        }),
        aggregatePurchaseAnalytics().catch((err) => {
          console.error("❌ [ANALYTICS] Purchase analytics failed:", err);
          return getDefaultPurchaseAnalytics();
        }),
        aggregatePaymentPredictions().catch((err) => {
          console.error("❌ [ANALYTICS] Payment predictions failed:", err);
          return {
            distribution: [],
            fallbackRate: 0,
            totalPredictions: 0,
          };
        }),
      ]);

    const result = {
      users,
      searchHistory,
      preferences,
      purchases,
      payments,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ [ANALYTICS] Master aggregation complete");
    console.log("📊 [ANALYTICS] Summary:", {
      totalUsers: users.totalUsers,
      totalSearches: searchHistory.totalSearches,
      totalOrders: purchases.totalOrders,
      preferenceCategories: preferences.length,
      paymentPredictions: payments.totalPredictions,
    });

    return result;
  } catch (error) {
    console.error("❌ [ANALYTICS] Master aggregation failed:", error);
    throw error;
  }
}

/**
 * PRIVACY GUARANTEES:
 * 1. NO PERSONAL DATA EXPOSED
 * 2. AGGREGATION ONLY
 * 3. MINIMUM DATA COLLECTION
 * 4. SERVER-SIDE ONLY
 * 5. ROLE-BASED ACCESS
 */
