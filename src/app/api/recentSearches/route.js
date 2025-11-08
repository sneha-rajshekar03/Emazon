// /app/api/recentSearches/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDB } from "@/app/utils/database";
import SearchHistory from "@/app/models/SearchHistory";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Fetch recent searches for logged-in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ searches: [] });
    }

    await connectToDB();

    // Get last 10 unique searches (sorted by most recent)
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

// POST - Save a new search (removes duplicates automatically)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, category } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    await connectToDB();

    const normalizedQuery = query.trim();

    // Remove any existing search with the same query (case-insensitive)
    // This ensures no duplicates and moves the search to the top when searched again
    await SearchHistory.findOneAndDelete({
      email: session.user.email,
      query: {
        $regex: new RegExp(
          `^${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    // Create new search entry
    const newSearch = await SearchHistory.create({
      email: session.user.email,
      query: normalizedQuery,
      category: category || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, search: newSearch });
  } catch (err) {
    console.error("Error saving search:", err);
    return NextResponse.json(
      { error: "Failed to save search" },
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
