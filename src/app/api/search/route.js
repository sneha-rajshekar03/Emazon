import { NextResponse } from "next/server";
import fuzzysort from "fuzzysort";
import productsData from "../products/products.json";

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ valid: false, products: [] });
    }

    const q = query.toLowerCase().trim();

    // 🔹 Flatten products for fuzzy search
    const allProducts = productsData.flatMap((c) =>
      c.products.map((p) => ({
        ...p,
        category: c.category_name,
        searchable: `${p.name} ${c.category_name}`.toLowerCase(),
      }))
    );

    // 🔹 1) Category match (direct substring OR fuzzy)
    const matchedCategory = (() => {
      const normalizedCategories = productsData.map((c) => ({
        ...c,
        originalName: c.category_name,
        category_name: c.category_name.toLowerCase().trim(),
      }));

      // Direct includes
      const direct = normalizedCategories.find((c) =>
        c.category_name.includes(q)
      );
      if (direct) return direct;

      // Fuzzy category search
      const categoryResults = fuzzysort.go(q, normalizedCategories, {
        key: "category_name",
        limit: 1,
        threshold: -10000,
      });

      return categoryResults.length > 0 ? categoryResults[0].obj : null;
    })();

    if (matchedCategory) {
      return NextResponse.json({
        valid: true,
        type: "category",
        category: matchedCategory.originalName,
        products: matchedCategory.products,
      });
    }

    // 🔹 2) Product match (fuzzy search on name + category)
    const results = fuzzysort.go(q, allProducts, {
      key: "searchable",
      limit: 9,
      threshold: -10000,
    });
    const matchedProducts = results.map((r) => r.obj);

    if (matchedProducts.length > 0) {
      return NextResponse.json({
        valid: true,
        type: "products",
        products: matchedProducts,
      });
    }

    // 🔹 3) Nothing found
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
