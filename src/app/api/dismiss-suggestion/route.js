// app/api/dismiss-suggestion/route.js

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/utils/database";
import mongoose from "mongoose";

// Dismissed Suggestion Schema (must match the one in repeat-suggestions)
const DismissedSuggestionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  product_id: {
    type: String,
    required: true,
  },
  dismissed_at: {
    type: Date,
    default: Date.now,
  },
  cycle_start: {
    type: Date,
    required: true,
  },
  cycle_end: {
    type: Date,
    required: true,
    index: true,
  },
  expected_next_date: {
    type: Date,
    required: true,
  },
});

DismissedSuggestionSchema.index({ user_id: 1, product_id: 1, cycle_end: 1 });

const DismissedSuggestion =
  mongoose.models.DismissedSuggestion ||
  mongoose.model("DismissedSuggestion", DismissedSuggestionSchema);

export async function POST(request) {
  try {
    console.log("\n=== DISMISS SUGGESTION API START ===");

    const session = await getServerSession(authOptions);
    console.log("[Dismiss] Session user:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("[Dismiss] ❌ No session - returning 401");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const body = await request.json();
    console.log("[Dismiss] Request body:", body);

    const { product_id, expected_next_date, avg_reorder_interval } = body;

    if (!product_id || !expected_next_date || !avg_reorder_interval) {
      console.log("[Dismiss] ❌ Missing required fields");
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const today = new Date();

    // Define cycle boundaries (±3 days from expected date)
    const expectedDate = new Date(expected_next_date);
    const cycleStart = new Date(expectedDate);
    cycleStart.setDate(cycleStart.getDate() - 3);

    const cycleEnd = new Date(expectedDate);
    cycleEnd.setDate(cycleEnd.getDate() + 3);

    console.log("[Dismiss] Cycle window:", {
      start: cycleStart.toISOString(),
      end: cycleEnd.toISOString(),
    });

    // Check if already dismissed in current cycle
    const existing = await DismissedSuggestion.findOne({
      user_id: userId,
      product_id,
      cycle_end: { $gte: today },
    });

    if (existing) {
      console.log("[Dismiss] Already dismissed for this cycle");
      return Response.json({
        success: true,
        message: "Already dismissed for this cycle",
      });
    }

    // Store dismissal for this cycle
    const dismissal = await DismissedSuggestion.create({
      user_id: userId,
      product_id,
      dismissed_at: today,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
      expected_next_date: expectedDate,
    });

    console.log("[Dismiss] ✓ Dismissal saved:", dismissal._id);

    // Clean up old dismissals (older than 6 months) in background
    DismissedSuggestion.deleteMany({
      user_id: userId,
      cycle_end: {
        $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    })
      .then((result) =>
        console.log(
          "[Dismiss] Cleanup: deleted",
          result.deletedCount,
          "old records"
        )
      )
      .catch((err) => console.error("[Dismiss] Cleanup error:", err));

    console.log("=== DISMISS SUGGESTION API END ===\n");

    return Response.json({
      success: true,
      message: "Suggestion dismissed for this cycle",
    });
  } catch (error) {
    console.error("[Dismiss] ❌ Error:", error);
    return Response.json(
      { error: "Failed to dismiss suggestion" },
      { status: 500 }
    );
  }
}
