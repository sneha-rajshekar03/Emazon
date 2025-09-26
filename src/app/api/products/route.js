import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import Product from "@app/models/Product";
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    await connectToDB();

    let products;
    if (category) {
      products = await Product.find({
        category_name: { $regex: category, $options: "i" },
      }).lean();
    } else {
      products = await Product.find({}).lean();
    }

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json({ products: [], error: "Server error" });
  }
}
