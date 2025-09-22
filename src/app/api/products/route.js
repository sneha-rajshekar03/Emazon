import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.rainforestapi.com/request?api_key=${process.env.RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.com&search_term=babies`
    );
    const data = await res.json();

    // Get only first 9 products
    const products = data.search_results.slice(0, 9);

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
