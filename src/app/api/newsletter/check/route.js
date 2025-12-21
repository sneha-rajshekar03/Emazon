import { connectToDB } from "@/app/utils/database";
import Newsletter from "@/app/models/Newsletter";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ isSubscribed: false });
    }

    const existing = await Newsletter.findOne({
      email,
      isActive: true,
    }).lean();

    return NextResponse.json({
      isSubscribed: Boolean(existing),
    });
  } catch (error) {
    console.error("❌ Newsletter check error:", error);
    return NextResponse.json({ isSubscribed: false });
  }
}
