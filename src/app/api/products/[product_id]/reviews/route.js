import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import Product from "@/app/models/Product";
// 🟢 POST — Add a new customer review
export async function POST(request, { params }) {
  try {
    const { product_id } = params;
    const { user, rating, text } = await request.json();

    if (!user || !rating || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDB();

    const product = await Product.findOne({ product_id });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 🟢 Add the review into customer_reviews array
    const newReview = {
      user,
      rating: Number(rating),
      comment: text,
    };

    product.customer_reviews.push(newReview);

    // 🟡 Recalculate average stars
    const totalRating = product.customer_reviews.reduce(
      (sum, r) => sum + Number(r.rating),
      0
    );
    product.stars = totalRating / product.customer_reviews.length;

    await product.save();

    return NextResponse.json(
      {
        message: "Review added successfully",
        reviews: product.customer_reviews,
        stars: product.stars,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    return NextResponse.json(
      { error: "Server error while submitting review" },
      { status: 500 }
    );
  }
}

// 🟡 GET — Fetch reviews (with pagination)
export async function GET(request, { params }) {
  try {
    const { product_id } = params;
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "3");

    await connectToDB();

    const product = await Product.findOne({ product_id });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = product.customer_reviews.slice(skip, skip + limit);

    return NextResponse.json(
      { reviews, stars: product.stars },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Server error while fetching reviews" },
      { status: 500 }
    );
  }
}
