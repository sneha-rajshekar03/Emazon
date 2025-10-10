import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@app/api/auth/[...nextauth]/route";
import { connectToDB } from "@app/utils/database";
import Cart from "@app/models/Cart";
import PurchaseHistory from "@app/models/PurchaseHistory";

export async function GET(req) {
  console.log("📜 [PURCHASE HISTORY API] GET request received");

  try {
    const session = await getServerSession(authOptions);
    console.log(
      "📜 [PURCHASE HISTORY API] Session:",
      session ? "Found" : "Not found"
    );

    if (!session?.user?.id) {
      console.log(
        "❌ [PURCHASE HISTORY API] Unauthorized - no session or user ID"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();
    console.log("📜 [PURCHASE HISTORY API] Connected to DB");

    const purchases = await PurchaseHistory.find({ user_id: session.user.id })
      .sort({ transaction_date: -1 })
      .lean();

    console.log(
      "📜 [PURCHASE HISTORY API] Found purchases:",
      purchases?.length || 0
    );

    return NextResponse.json({
      purchases: purchases || [],
    });
  } catch (error) {
    console.error(
      "❌ [PURCHASE HISTORY API] Error fetching purchase history:",
      error
    );
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  console.log("🛒 [CHECKOUT API] POST request received");

  try {
    const session = await getServerSession(authOptions);
    console.log("🛒 [CHECKOUT API] Session:", session ? "Found" : "Not found");

    if (!session?.user?.id) {
      console.log("❌ [CHECKOUT API] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const body = await req.json();
    const paymentMethod = body.payment_method;
    const deviceType = body.device_type || "Unknown";

    console.log("🛒 [CHECKOUT API] Body:", JSON.stringify(body, null, 2));

    if (!paymentMethod || !["upi", "card", "cod"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method. Must be upi, card, or cod" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ user_id: session.user.id });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Convert cart item field names if needed
    const formattedItems = cart.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price, // use unit_price as per your DB
    }));

    const totalAmount = formattedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()}`;

    const purchaseData = {
      transaction_id: transactionId,
      user_id: session.user.id,
      transaction_date: Date.now(),
      items: formattedItems,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      device_type: deviceType,
      status: "completed",
    };

    console.log(
      "🛒 [CHECKOUT API] Final purchase data:",
      JSON.stringify(purchaseData, null, 2)
    );

    const purchase = await PurchaseHistory.create(purchaseData);
    console.log("✅ [CHECKOUT API] Purchase created:", purchase._id);

    // Clear cart after successful checkout
    await Cart.findOneAndUpdate({ user_id: session.user.id }, { items: [] });
    console.log("✅ [CHECKOUT API] Cart cleared");

    return NextResponse.json({
      success: true,
      purchase_id: purchase._id,
      transaction_id: purchase.transaction_id,
      total_amount: purchase.total_amount,
      payment_method: purchase.payment_method,
      device_type: purchase.device_type,
      status: purchase.status,
    });
  } catch (error) {
    console.error("❌ [CHECKOUT API] Error during checkout:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
