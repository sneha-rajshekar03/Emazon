import { NextResponse } from "next/server";
import { connectToDB } from "@app/utils/database";
import SearchHistory from "@app/models/SearchHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
export async function GET() {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ category: null, query: null });
    }

    const lastSearch = await SearchHistory.findOne({
      email: session.user.email, // ✅ fixed field
    })
      .sort({ searchedAt: -1 })
      .lean();
    console.log(lastSearch, "latsnfn");
    return NextResponse.json({
      category: lastSearch?.category || null,
      query: lastSearch?.query || null,
    });
  } catch (err) {
    console.error("Last search API error:", err);
    return NextResponse.json({ category: null, query: null });
  }
}
