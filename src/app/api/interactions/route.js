import { connectToDB } from "@/app/utils/database";
import { NextResponse } from "next/server";
import UserPreference from "@/app/models/UserPreference";

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    console.log("📥 Received interactions body:", body);

    const { userId, interactions } = body;

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
      console.log("⚠️ Empty interactions array, clearing preferences");
      // Handle empty array case - clear preferences
      const userPref = await UserPreference.findOneAndUpdate(
        { userId },
        { userId, preferences: [] },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, preferences: [] });
    }

    // Validate and normalize interactions
    const normalized = interactions
      .filter(({ element, score }) => {
        // Filter out invalid entries
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
        score: Math.max(0, Math.round(score * 100) / 100), // Round to 2 decimal places and ensure non-negative
      }))
      .filter(({ element }) => element.length > 0); // Remove empty elements

    console.log(`📊 Normalized ${normalized.length} interactions:`, normalized);

    if (normalized.length === 0) {
      console.log("⚠️ No valid interactions after normalization");
      return NextResponse.json(
        { success: false, error: "No valid interactions provided" },
        { status: 400 }
      );
    }

    // Update user preferences
    console.log(`💾 Updating preferences for user: ${userId}`);
    const userPref = await UserPreference.findOneAndUpdate(
      { userId },
      {
        userId,
        preferences: normalized,
        updatedAt: new Date(), // Add timestamp
      },
      { upsert: true, new: true }
    );

    if (!userPref) {
      throw new Error("Failed to update user preferences");
    }

    // Sort before sending back (highest score first)
    const sorted = [...userPref.preferences].sort((a, b) => b.score - a.score);

    console.log(
      `✅ Successfully saved ${sorted.length} preferences for user ${userId}`
    );
    console.log("📤 Returning sorted preferences:", sorted);

    return NextResponse.json({
      success: true,
      preferences: sorted,
      count: sorted.length,
      updatedAt: userPref.updatedAt || new Date(),
    });
  } catch (err) {
    console.error("❌ Error saving interactions:", err);

    // Better error handling
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

// Optional: Add GET endpoint for fetching preferences
export async function GET(req) {
  try {
    await connectToDB();

    // Extract userId from query params or URL
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching preferences for user: ${userId}`);

    const userPref = await UserPreference.findOne({ userId });

    if (!userPref) {
      console.log(`ℹ️ No preferences found for user: ${userId}`);
      return NextResponse.json({
        success: true,
        preferences: [],
        count: 0,
      });
    }

    // Sort preferences by score (highest first)
    const sorted = [...userPref.preferences].sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${sorted.length} preferences for user ${userId}`);

    return NextResponse.json({
      success: true,
      preferences: sorted,
      count: sorted.length,
      updatedAt: userPref.updatedAt,
    });
  } catch (err) {
    console.error("❌ Error fetching preferences:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch preferences",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
