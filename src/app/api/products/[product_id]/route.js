// src/app/api/products/[product_id]/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/utils/database";
import Product from "@/app/models/product";
export async function GET(req, context) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  console.log(`\n========== REQUEST ${requestId} START ==========`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 URL: ${req.url}`);

  try {
    // ✅ Await params destructuring (Next.js 15+)
    const params = await context.params;
    const { product_id } = params;

    console.log(`📦 [${requestId}] Product ID requested: "${product_id}"`);
    console.log(`📦 [${requestId}] Params object:`, params);

    console.log(`🔌 [${requestId}] Connecting to MongoDB...`);
    await connectToDB();
    console.log(`✅ [${requestId}] MongoDB connected`);

    console.log(
      `🔍 [${requestId}] Searching for product with product_id: "${product_id}"`
    );
    const product = await Product.findOne({ product_id }).lean();

    if (!product) {
      console.log(`❌ [${requestId}] Product NOT FOUND in database`);
      console.log(
        `❌ [${requestId}] Searched for: { product_id: "${product_id}" }`
      );

      // Let's check if ANY products exist
      const count = await Product.countDocuments();
      console.log(`📊 [${requestId}] Total products in DB: ${count}`);

      // Check if a similar product exists
      const sample = await Product.findOne().select("product_id title").lean();
      console.log(`📋 [${requestId}] Sample product:`, sample);

      const elapsed = Date.now() - startTime;
      console.log(`⏱️ [${requestId}] Request took ${elapsed}ms`);
      console.log(`========== REQUEST ${requestId} END (404) ==========\n`);

      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`✅ [${requestId}] Product FOUND: "${product.title}"`);
    console.log(`📄 [${requestId}] Product data:`, {
      product_id: product.product_id,
      title: product.title,
      price: product.price,
      hasImage: !!product.imgUrl,
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Request took ${elapsed}ms`);
    console.log(`========== REQUEST ${requestId} END (200) ==========\n`);

    return NextResponse.json(product);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`💥 [${requestId}] ERROR:`, err);
    console.error(`💥 [${requestId}] Error stack:`, err.stack);
    console.log(`⏱️ [${requestId}] Request failed after ${elapsed}ms`);
    console.log(`========== REQUEST ${requestId} END (500) ==========\n`);

    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
