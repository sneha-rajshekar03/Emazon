import { connectToDB } from "@app/utils/database";
import { NextResponse } from "next/server";
import UserPreference from "@app/models/UserPreference";

// GET /api/preferences/[userId] - Fetch user preferences
export async function GET(request, { params }) {
  try {
    await connectToDB();

    // Await params before using its properties
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching preferences for user: ${userId}`);

    const preference = await UserPreference.findOne({ userId });

    if (!preference) {
      console.log(`ℹ️ No preferences found for user: ${userId}`);
      return NextResponse.json({
        success: true,
        preferences: [], // Changed from 'interactions' to 'preferences' for consistency
        count: 0,
      });
    }

    // Sort preferences by score (highest first)
    const sortedPreferences = [...preference.preferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    console.log(
      `✅ Found ${sortedPreferences.length} preferences for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      preferences: sortedPreferences,
      count: sortedPreferences.length,
      updatedAt: preference.updatedAt,
    });
  } catch (error) {
    console.error("❌ Error fetching preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch preferences",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PUT /api/preferences/[userId] - Update user preferences
export async function PUT(request, { params }) {
  try {
    await connectToDB();

    // Await params before using its properties
    const { userId } = await params;
    const body = await request.json();

    // Accept both 'interactions' and 'preferences' for flexibility
    const interactions = body.interactions || body.preferences;

    console.log("📥 Received PUT request body:", body);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!interactions || !Array.isArray(interactions)) {
      return NextResponse.json(
        { success: false, error: "Interactions/preferences array is required" },
        { status: 400 }
      );
    }

    // Validate and normalize interactions (same as POST endpoint)
    const normalized = interactions
      .filter(({ element, score }) => {
        if (!element || typeof element !== "string") {
          console.warn(`⚠️ Invalid element: ${element}`);
          return false;
        }
        if (typeof score !== "number" || isNaN(score)) {
          console.warn(`⚠️ Invalid score for ${element}: ${score}`);
          return false;
        }
        return true;
      })
      .map(({ element, score }) => ({
        element: element.trim().toLowerCase(),
        score: Math.max(0, Math.round(score * 100) / 100),
      }))
      .filter(({ element }) => element.length > 0);

    console.log(`📊 Normalized ${normalized.length} interactions:`, normalized);

    if (normalized.length === 0 && interactions.length > 0) {
      return NextResponse.json(
        { success: false, error: "No valid interactions provided" },
        { status: 400 }
      );
    }

    console.log(`💾 Updating preferences for user: ${userId}`);

    const updatedPreference = await UserPreference.findOneAndUpdate(
      { userId },
      {
        userId,
        preferences: normalized, // Store as 'preferences' to match schema
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPreference) {
      throw new Error("Failed to update user preferences");
    }

    // Sort before sending back
    const sorted = [...updatedPreference.preferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    console.log(
      `✅ Successfully updated ${sorted.length} preferences for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      preferences: sorted,
      count: sorted.length,
      updatedAt: updatedPreference.updatedAt,
    });
  } catch (error) {
    console.error("❌ Error updating preferences:", error);

    const errorMessage = error.message || "Failed to update preferences";
    const statusCode = error.name === "ValidationError" ? 400 : 500;

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

// DELETE /api/preferences/[userId] - Delete user preferences
export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    // Await params before using its properties
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting preferences for user: ${userId}`);

    const deletedPreference = await UserPreference.findOneAndDelete({ userId });

    if (!deletedPreference) {
      console.log(`⚠️ No preferences found to delete for user: ${userId}`);
      return NextResponse.json(
        { success: false, error: "Preferences not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully deleted preferences for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Preferences deleted successfully",
      deletedCount: deletedPreference.preferences?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error deleting preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete preferences",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional: PATCH method for partial updates
export async function PATCH(request, { params }) {
  try {
    await connectToDB();

    const { userId } = await params;
    const body = await request.json();
    const { element, score } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!element || typeof score !== "number") {
      return NextResponse.json(
        { success: false, error: "Element name and score are required" },
        { status: 400 }
      );
    }

    console.log(
      `🔄 Updating single preference for user ${userId}: ${element} = ${score}`
    );

    // Find existing preferences
    const userPref = await UserPreference.findOne({ userId });
    let preferences = userPref ? [...userPref.preferences] : [];

    // Update or add the specific element
    const normalizedElement = element.trim().toLowerCase();
    const normalizedScore = Math.max(0, Math.round(score * 100) / 100);

    const existingIndex = preferences.findIndex(
      (p) => p.element === normalizedElement
    );

    if (existingIndex >= 0) {
      preferences[existingIndex].score = normalizedScore;
      console.log(`📝 Updated existing preference: ${normalizedElement}`);
    } else {
      preferences.push({ element: normalizedElement, score: normalizedScore });
      console.log(`➕ Added new preference: ${normalizedElement}`);
    }

    // Save updated preferences
    const updatedPreference = await UserPreference.findOneAndUpdate(
      { userId },
      {
        userId,
        preferences,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Sort before sending back
    const sorted = [...updatedPreference.preferences].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    return NextResponse.json({
      success: true,
      preferences: sorted,
      count: sorted.length,
      updatedElement: { element: normalizedElement, score: normalizedScore },
      updatedAt: updatedPreference.updatedAt,
    });
  } catch (error) {
    console.error("❌ Error patching preference:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update preference",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
