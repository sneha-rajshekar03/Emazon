// /app/api/recentSearches/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@app/utils/database";
import SearchHistory from "@app/models/SearchHistory";
import { authOptions } from "@app/api/auth/[...nextauth]/route";

// GET - Fetch recent searches for logged-in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ searches: [] });
    }

    await connectToDB();

    // Get last 10 unique searches
    const searches = await SearchHistory.find({
      email: session.user.email,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ searches });
  } catch (err) {
    console.error("Error fetching recent searches:", err);
    return NextResponse.json(
      { error: "Failed to fetch searches" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a specific search from history
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get("id");

    if (!searchId) {
      return NextResponse.json(
        { error: "Search ID required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const result = await SearchHistory.findOneAndDelete({
      _id: searchId,
      email: session.user.email, // Ensure user can only delete their own searches
    });

    if (!result) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting search:", err);
    return NextResponse.json(
      { error: "Failed to delete search" },
      { status: 500 }
    );
  }
}
