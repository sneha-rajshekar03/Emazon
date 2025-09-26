import { connectToDB } from "@app/utils/database";
import { NextResponse } from "next/server";
import UserPreference from "@app/models/UserPreference";

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    console.log("📥 Received interactions body:", body);

    const { userId, interactions } = body;
    if (!userId || !Array.isArray(interactions)) {
      return NextResponse.json(
        { success: false, error: "Missing userId or interactions" },
        { status: 400 }
      );
    }

    // 🔥 Replace old preferences with fresh ones
    const normalized = interactions.map(({ element, score }) => ({
      element: element.trim().toLowerCase(),
      score: score > 0 ? score : 0,
    }));

    const userPref = await UserPreference.findOneAndUpdate(
      { userId },
      { userId, preferences: normalized },
      { upsert: true, new: true }
    );

    // sort before sending back
    const sorted = [...userPref.preferences].sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, preferences: sorted });
  } catch (err) {
    console.error("❌ Error saving interactions:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
