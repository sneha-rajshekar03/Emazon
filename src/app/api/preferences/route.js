import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import UserPreference from "@app/models/UserPreference";

// GET /api/preferences?userId=123 - Fetch user preferences
export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching preferences for user: ${userId}`);

    const userPrefs = await UserPreference.findOne({ userId }).lean();

    if (!userPrefs) {
      console.log(`ℹ️ No preferences found for user: ${userId}`);
      return NextResponse.json({
        success: true,
        preferences: [],
        count: 0,
      });
    }

    // Sort preferences by score (highest first)
    const sortedPrefs = [...userPrefs.preferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    console.log(
      `✅ Found ${sortedPrefs.length} preferences for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      preferences: sortedPrefs,
      count: sortedPrefs.length,
      updatedAt: userPrefs.updatedAt,
    });
  } catch (err) {
    console.error("❌ GET /api/preferences error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch preferences",
        details: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/preferences - Save/update user preferences
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const { userId, interactions } = body;

    console.log("📥 Received POST payload:", {
      userId,
      interactionsCount: interactions?.length,
    });
    console.log("📊 Interactions details:", interactions);

    // Enhanced validation
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(interactions)) {
      return NextResponse.json(
        { success: false, error: "Interactions must be an array" },
        { status: 400 }
      );
    }

    if (interactions.length === 0) {
      console.log("⚠️ Empty interactions array received");
      // Handle empty array - could clear preferences or return current state
      let userPref = await UserPreference.findOne({ userId });
      if (!userPref) {
        userPref = await UserPreference.create({ userId, preferences: [] });
      }

      return NextResponse.json({
        success: true,
        preferences: userPref.preferences,
        count: userPref.preferences.length,
        message: "No interactions to process",
      });
    }

    // Find or create user preference document
    let userPref = await UserPreference.findOne({ userId });
    if (!userPref) {
      console.log(`🆕 Creating new preference document for user: ${userId}`);
      userPref = await UserPreference.create({ userId, preferences: [] });
    }

    let updatedCount = 0;
    let addedCount = 0;

    // Process each interaction
    for (const interaction of interactions) {
      const { element, score } = interaction;

      // Validate interaction data
      if (!element || typeof element !== "string") {
        console.warn(`⚠️ Invalid element in interaction:`, interaction);
        continue;
      }

      if (typeof score !== "number" || isNaN(score) || score < 0) {
        console.warn(`⚠️ Invalid score for element ${element}:`, score);
        continue;
      }

      const normalized = element.trim().toLowerCase();
      if (normalized.length === 0) {
        console.warn(`⚠️ Empty element after normalization:`, element);
        continue;
      }

      // Round score to 2 decimal places for consistency
      const normalizedScore = Math.round(score * 100) / 100;

      // Find existing preference or create new one
      const existingPref = userPref.preferences.find(
        (p) => p.element === normalized
      );

      if (existingPref) {
        if (existingPref.score !== normalizedScore) {
          console.log(
            `📝 Updating ${normalized}: ${existingPref.score} → ${normalizedScore}`
          );
          existingPref.score = normalizedScore;
          updatedCount++;
        }
      } else {
        console.log(
          `➕ Adding new preference: ${normalized} = ${normalizedScore}`
        );
        userPref.preferences.push({
          element: normalized,
          score: normalizedScore,
        });
        addedCount++;
      }
    }

    // Update the updatedAt timestamp
    userPref.updatedAt = new Date();

    // Save updated preferences
    await userPref.save();

    // Sort before returning (highest score first)
    const sortedPrefs = [...userPref.preferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    console.log(`✅ Successfully processed preferences for user ${userId}`);
    console.log(
      `📈 Stats: ${updatedCount} updated, ${addedCount} added, ${sortedPrefs.length} total`
    );

    return NextResponse.json({
      success: true,
      preferences: sortedPrefs,
      count: sortedPrefs.length,
      stats: {
        updated: updatedCount,
        added: addedCount,
        total: sortedPrefs.length,
      },
      updatedAt: userPref.updatedAt,
    });
  } catch (err) {
    console.error("❌ Error saving preferences:", err);

    // Better error categorization
    const errorMessage = err.message || "Unknown error occurred";
    const statusCode = err.name === "ValidationError" ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}

// Optional: DELETE method to clear all preferences for a user
export async function DELETE(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting all preferences for user: ${userId}`);

    const result = await UserPreference.findOneAndDelete({ userId });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "No preferences found to delete" },
        { status: 404 }
      );
    }

    console.log(
      `✅ Deleted ${result.preferences.length} preferences for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      message: "All preferences deleted successfully",
      deletedCount: result.preferences.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error deleting preferences:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete preferences",
        details: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
