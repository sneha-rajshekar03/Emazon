// File: src/app/api/products/[product_id]/similar/route.js

import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import Product from "@app/models/Product";

export async function GET(request, { params }) {
  const { product_id } = await params;

  try {
    await connectToDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    // First, find the current product to get its category
    const currentProduct = await Product.findOne({ product_id }).select(
      "category_id category_name"
    );

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Now fetch similar products from the same category
    const similarProducts = await Product.find({
      category_id: currentProduct.category_id,
      product_id: { $ne: product_id }, // Exclude current product
    })
      .select("product_id title price listPrice stars imgUrl category_name")
      .limit(limit)
      .lean();

    if (!similarProducts || similarProducts.length === 0) {
      return NextResponse.json(
        {
          products: [],
          message: "No similar products found in this category",
          category_id: currentProduct.category_id,
          category_name: currentProduct.category_name,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        products: similarProducts,
        total: similarProducts.length,
        category_id: currentProduct.category_id,
        category_name: currentProduct.category_name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar products", details: error.message },
      { status: 500 }
    );
  }
}
