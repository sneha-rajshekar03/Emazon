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

    const prefs = await UserPreference.findOne({ userId });
    return NextResponse.json({
      preferences: prefs?.interactions || [],
    });
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

    for (const { element, score } of interactions) {
      const updated = await UserPreference.findOneAndUpdate(
        { userId, "preferences.element": element },
        {
          $set: {
            "preferences.$.score": score, // 🔥 overwrite instead of incremen
          },
        },
        { new: true }
      );

      if (!updated) {
        // If section doesn’t exist yet, push new one
        await UserPreference.findOneAndUpdate(
          { userId },
          {
            $setOnInsert: { userId },
            $push: {
              preferences: {
                element: element,
                score: score,
              },
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving preferences:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
