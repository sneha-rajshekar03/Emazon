// File: src/app/api/products/[product_id]/reviews/route.js

import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import Product from "@app/models/Product";

// POST - Add a new review
export async function POST(request, { params }) {
  const { product_id } = await params; // ← Await params

  try {
    await connectToDB();

    // Parse request body
    const { user, rating, comment } = await request.json();

    // Validate input
    if (!user || rating === undefined || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert rating to number (handle both plain numbers and $numberInt format)
    const ratingValue = parseInt(rating.$numberInt || rating);

    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Create new review object - store as plain number, not extended JSON
    const newReview = {
      user: user.trim(),
      rating: ratingValue, // ← Plain number, not { $numberInt: ... }
      comment: comment.trim(),
    };

    // Find product
    const product = await Product.findOne({ product_id: product_id });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Add review to customer_reviews array
    if (!product.customer_reviews) {
      product.customer_reviews = [];
    }
    product.customer_reviews.push(newReview);

    // Calculate new average rating
    const totalRating = product.customer_reviews.reduce((sum, review) => {
      // Handle both number and $numberInt formats for backward compatibility
      const reviewRating =
        typeof review.rating === "object" && review.rating?.$numberInt
          ? parseInt(review.rating.$numberInt)
          : Number(review.rating);
      return sum + reviewRating;
    }, 0);

    const averageRating = totalRating / product.customer_reviews.length;

    // Update product with new review and average rating
    product.stars = averageRating;
    await product.save();

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch paginated reviews
export async function GET(request, { params }) {
  const { product_id } = await params; // ← Await params

  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip")) || 0;
    const limit = parseInt(searchParams.get("limit")) || 3;

    await connectToDB();

    // Find product
    const product = await Product.findOne({ product_id: product_id }).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const allReviews = product.customer_reviews || [];

    // Get paginated reviews
    const paginatedReviews = allReviews.slice(skip, skip + limit);

    return NextResponse.json({
      customer_reviews: paginatedReviews,
      total: allReviews.length,
      skip: skip,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}
