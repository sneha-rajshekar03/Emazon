import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import UserPreference from "@app/models/UserPreference";
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
        { userId, "preferences.section": element },
        {
          $set: { "preferences.$.lastInteracted": new Date() },
          $inc: { "preferences.$.count": score },
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
                section: element,
                count: score,
                lastInteracted: new Date(),
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
