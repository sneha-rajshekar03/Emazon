import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import RecentlyViewed from "@/app/models/RecentlyViewed";

// GET - Fetch user's recently viewed products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const userHistory = await RecentlyViewed.findOne({ userId });

    if (!userHistory) {
      return NextResponse.json([]);
    }

    // Return sorted by most recent
    const sortedProducts = userHistory.products.sort(
      (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
    );

    return NextResponse.json(sortedProducts);
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently viewed" },
      { status: 500 }
    );
  }
}

// POST - Add product to user's recently viewed
export async function POST(request) {
  try {
    const { userId, productId, productData } = await request.json();

    if (!userId || !productId || !productData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Find or create user's recently viewed document
    let userHistory = await RecentlyViewed.findOne({ userId });

    if (!userHistory) {
      userHistory = new RecentlyViewed({
        userId,
        products: [],
      });
    }

    // Remove product if it already exists (to update position)
    userHistory.products = userHistory.products.filter(
      (p) => p.product_id !== productId
    );

    // Add product to the end (most recent)
    userHistory.products.push(productData);

    // Keep only last 10 products
    if (userHistory.products.length > 10) {
      userHistory.products = userHistory.products.slice(-10);
    }

    await userHistory.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving recently viewed:", error);
    return NextResponse.json(
      { error: "Failed to save recently viewed" },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's recently viewed
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    await RecentlyViewed.findOneAndDelete({ userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing recently viewed:", error);
    return NextResponse.json(
      { error: "Failed to clear recently viewed" },
      { status: 500 }
    );
  }
}
