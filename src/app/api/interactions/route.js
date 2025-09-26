import { connectToDB } from "@app/utils/database";
import { NextResponse } from "next/server";
import UserPreference from "@app/models/UserPreference";

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    console.log("📥 Received interactions body:", body);

    const { userId, interactions } = body;
    if (!userId || !interactions) {
      return NextResponse.json(
        { success: false, error: "Missing userId or interactions" },
        { status: 400 }
      );
    }

    let userPref = await UserPreference.findOne({ userId });
    if (!userPref) {
      userPref = await UserPreference.create({ userId, preferences: [] });
    }

    for (const { element, score } of interactions) {
      // Only care about meaningful scores
      if (score <= 0) continue;

      const pref = userPref.preferences.find((p) => p.element === element);
      if (pref) {
        // increment existing
        pref.score += score;
      } else {
        // add new
        userPref.preferences.push({ element, score });
      }
    }

    await userPref.save();

    return NextResponse.json({ success: true, data: userPref });
  } catch (err) {
    console.error("❌ Error saving interactions:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
