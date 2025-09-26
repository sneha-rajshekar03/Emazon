import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import UserPreference from "@app/models/UserPreference";
export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userPrefs = await UserPreference.findOne({ userId }).lean();
    if (!userPrefs) {
      return NextResponse.json({ preferences: [] });
    }
    userPrefs.preferences.sort((a, b) => b.score - a.score);

    return NextResponse.json(userPrefs);
  } catch (err) {
    console.error("❌ GET /api/preferences error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
export async function POST(req) {
  try {
    await connectToDB();
    const { userId, interactions } = await req.json();

    console.log("📥 Received payload:", interactions);

    if (!userId || !Array.isArray(interactions)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    let userPref = await UserPreference.findOne({ userId });
    if (!userPref) {
      userPref = await UserPreference.create({ userId, preferences: [] });
    }
    for (const { element, score } of interactions) {
      if (score < 0) continue;

      const normalized = element.trim().toLowerCase();

      const pref = userPref.preferences.find((p) => p.element === normalized);
      if (pref) {
        pref.score = score; // overwrite instead of increment
      } else {
        userPref.preferences.push({ element: normalized, score });
      }
    }

    // Save updated preferences
    await userPref.save();

    // Sort before returning
    const sortedPrefs = [...userPref.preferences].sort(
      (a, b) => b.score - a.score
    );

    return NextResponse.json({ success: true, preferences: sortedPrefs });
  } catch (err) {
    console.error("❌ Error saving preferences:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
