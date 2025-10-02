import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import Cart from "@app/models/Cart";

// GET - Fetch user's cart
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();
    const cart = await Cart.findOne({ user_id: session.user.id });

    return NextResponse.json({
      items: cart?.items || [],
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Save/Update user's cart
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    await connectToDB();

    const cart = await Cart.findOneAndUpdate(
      { user_id: session.user.id },
      { items },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
