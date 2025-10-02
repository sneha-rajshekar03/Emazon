import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import Cart from "@app/models/Cart";
import PurchaseHistory from "@app/models/PurchaseHistory";

export async function POST(req) {
  console.log("🛒 [CHECKOUT API] POST request received");
  try {
    const session = await getServerSession(authOptions);
    console.log("🛒 [CHECKOUT API] Session:", session ? "Found" : "Not found");
    console.log("🛒 [CHECKOUT API] User ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("❌ [CHECKOUT API] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🛒 [CHECKOUT API] Connecting to DB...");
    await connectToDB();

    // Parse request body to get payment method
    const body = await req.json();
    const paymentMethod = body.payment_method;
    console.log("🛒 [CHECKOUT API] Payment method received:", paymentMethod);

    console.log("🛒 [CHECKOUT API] Fetching cart...");
    // Get user's cart
    const cart = await Cart.findOne({ user_id: session.user.id });

    if (!cart || cart.items.length === 0) {
      console.log("❌ [CHECKOUT API] Cart is empty");
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    console.log("🛒 [CHECKOUT API] Cart items:", cart.items.length);

    // Calculate total
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    console.log("🛒 [CHECKOUT API] Total amount:", totalAmount);

    console.log("🛒 [CHECKOUT API] Creating purchase record...");
    // Create purchase history entry with payment method
    const purchase = await PurchaseHistory.create({
      user_id: session.user.id,
      items: cart.items,
      total_amount: totalAmount,
      payment_method: paymentMethod || "cod", // Default to COD if not provided
    });
    console.log("✅ [CHECKOUT API] Purchase created:", purchase._id);
    console.log(
      "✅ [CHECKOUT API] Payment method saved:",
      purchase.payment_method
    );

    console.log("🛒 [CHECKOUT API] Clearing cart...");
    // Clear the cart after successful checkout
    await Cart.findOneAndUpdate({ user_id: session.user.id }, { items: [] });
    console.log("✅ [CHECKOUT API] Cart cleared");

    return NextResponse.json({
      success: true,
      purchase_id: purchase._id,
      total_amount: totalAmount,
      payment_method: purchase.payment_method,
    });
  } catch (error) {
    console.error("❌ [CHECKOUT API] Error during checkout:", error);
    console.error("❌ [CHECKOUT API] Error stack:", error.stack);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
