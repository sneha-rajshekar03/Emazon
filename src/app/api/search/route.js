// /app/api/search/route.js
import { NextResponse } from "next/server";
import fuzzysort from "fuzzysort";
import { getServerSession } from "next-auth";
import { connectToDB } from "@app/utils/database";
import SearchHistory from "@app/models/SearchHistory";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import Product from "@app/models/Product";

// 🔹 normalize query & strings (handles plural/singular)
function normalize(str) {
  return str.toLowerCase().trim().replace(/s$/, ""); // strip trailing 's'
}

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ valid: false, products: [] });
    }

    const q = normalize(query);

    // ✅ connect once
    await connectToDB();

    // 🔹 Step 1: Direct category match
    const categories = await Product.distinct("category_name");
    const direct = categories.find((cat) => normalize(cat).includes(q));

    if (direct) {
      const productsInCat = await Product.find({
        category_name: new RegExp(`^${direct}$`, "i"),
      }).lean();

      // save to history
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        await SearchHistory.create({
          userId: session.user.email,
          query,
          email: session.user.email,
          category: direct,
        });
      }

      return NextResponse.json({
        valid: true,
        type: "category",
        category: direct,
        products: productsInCat.slice(0, 12),
      });
    }

    // 🔹 Step 2: Narrow down candidates with Mongo regex
    const candidates = await Product.find(
      {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { category_name: { $regex: q, $options: "i" } },
        ],
      },
      "title category_name product_id imgUrl price stars"
    ).lean();

    // 🔹 Step 3: Fuzzy search on narrowed candidates
    const results = fuzzysort.go(q, candidates, {
      key: "title",
      limit: 12,
      threshold: -100, // stricter = avoids bad matches
    });

    const matchedProducts = results.map((r) => r.obj);

    if (matchedProducts.length > 0) {
      return NextResponse.json({
        valid: true,
        type: "products",
        products: matchedProducts,
      });
    }

    // 🔹 Step 4: Nothing found
    return NextResponse.json({ valid: false, products: [] });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({
      valid: false,
      products: [],
      error: "Server error",
    });
  }
}
