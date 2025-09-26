// /app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import Product from "@app/models/Product";

export async function GET(req, context) {
  try {
    const { product_id } = await context.params; // ✅ await destructure
    console.log("PRODUCT_ID", product_id);
    await connectToDB();
    const product = await Product.findOne({ product_id }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
