import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/utils/database";
import Cart from "@/app/models/Cart";
import PurchaseHistory from "@/app/models/PurchaseHistory";

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

    // Parse request body to get all checkout data
    const body = await req.json();
    const { transaction_id, payment_method, device_type, items } = body;

    console.log("🛒 [CHECKOUT API] Transaction ID:", transaction_id);
    console.log("🛒 [CHECKOUT API] Payment method:", payment_method);
    console.log("🛒 [CHECKOUT API] Device type:", device_type);
    console.log("🛒 [CHECKOUT API] Items from request:", items?.length);

    // Validate required fields
    if (!transaction_id) {
      console.log("❌ [CHECKOUT API] Missing transaction_id");
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!device_type) {
      console.log("❌ [CHECKOUT API] Missing device_type");
      return NextResponse.json(
        { error: "Device type is required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      console.log("❌ [CHECKOUT API] No items provided");
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total from the items sent in request
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    console.log("🛒 [CHECKOUT API] Total amount:", totalAmount);

    console.log("🛒 [CHECKOUT API] Creating purchase record...");
    // Create purchase history entry with all required fields
    const purchase = await PurchaseHistory.create({
      transaction_id,
      user_id: session.user.id,
      transaction_date: new Date(),
      items, // Items already formatted with unit_price from frontend
      total_amount: totalAmount,
      payment_method: payment_method || "cod",
      device_type,
      status: "completed",
    });

    console.log("✅ [CHECKOUT API] Purchase created:", purchase._id);
    console.log("✅ [CHECKOUT API] Transaction ID:", purchase.transaction_id);
    console.log("✅ [CHECKOUT API] Payment method:", purchase.payment_method);
    console.log("✅ [CHECKOUT API] Device type:", purchase.device_type);

    console.log("🛒 [CHECKOUT API] Clearing cart...");
    // Clear the cart after successful checkout
    await Cart.findOneAndUpdate({ user_id: session.user.id }, { items: [] });
    console.log("✅ [CHECKOUT API] Cart cleared");

    return NextResponse.json({
      success: true,
      purchase_id: purchase._id,
      transaction_id: purchase.transaction_id,
      total_amount: totalAmount,
      payment_method: purchase.payment_method,
      device_type: purchase.device_type,
    });
  } catch (error) {
    console.error("❌ [CHECKOUT API] Error during checkout:", error);
    console.error("❌ [CHECKOUT API] Error stack:", error.stack);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
