import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/app/utils/database";
import Cart from "@/app/models/Cart";
import PurchaseHistory from "@/app/models/PurchaseHistory";
import Product from "@/app/models/Product";

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
    console.log("🛒 [CHECKOUT API] Raw items:", JSON.stringify(items, null, 2));

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

    // ✅ FIX: Validate and correct product_id for each item
    console.log("🔍 [CHECKOUT API] Validating product IDs...");
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const itemProductId = item.product_id;
        console.log(`  Checking item with product_id: ${itemProductId}`);

        // Check if it looks like a MongoDB _id (24 hex characters)
        const isMongoDB = /^[0-9a-f]{24}$/i.test(itemProductId);
        console.log(`  Is MongoDB format: ${isMongoDB}`);

        let actualProductId = itemProductId;

        if (isMongoDB) {
          // It's a MongoDB _id, we need to fetch the actual product_id
          console.log(
            `  ⚠️ MongoDB _id detected, fetching actual product_id...`
          );
          try {
            const product = await Product.findById(itemProductId).lean();
            if (product && product.product_id) {
              actualProductId = product.product_id;
              console.log(`  ✅ Found actual product_id: ${actualProductId}`);
            } else {
              console.log(`  ⚠️ Product not found, keeping original ID`);
            }
          } catch (err) {
            console.error(`  ❌ Error fetching product:`, err);
          }
        } else {
          console.log(`  ✅ Already using product_id format`);
        }

        return {
          product_id: actualProductId, // Use the correct product_id
          quantity: item.quantity,
          unit_price: item.unit_price,
        };
      })
    );

    console.log(
      "✅ [CHECKOUT API] Validated items:",
      JSON.stringify(validatedItems, null, 2)
    );

    // Calculate total from the validated items
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    console.log("🛒 [CHECKOUT API] Total amount:", totalAmount);

    console.log("🛒 [CHECKOUT API] Creating purchase record...");
    // Create purchase history entry with validated items
    const purchase = await PurchaseHistory.create({
      transaction_id,
      user_id: session.user.id,
      transaction_date: new Date(),
      items: validatedItems, // Use validated items with correct product_id
      total_amount: totalAmount,
      payment_method: payment_method || "cod",
      device_type,
      status: "completed",
    });

    console.log("✅ [CHECKOUT API] Purchase created:", purchase._id);
    console.log("✅ [CHECKOUT API] Transaction ID:", purchase.transaction_id);
    console.log("✅ [CHECKOUT API] Payment method:", purchase.payment_method);
    console.log("✅ [CHECKOUT API] Device type:", purchase.device_type);
    console.log(
      "✅ [CHECKOUT API] Purchase items:",
      JSON.stringify(purchase.items, null, 2)
    );

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
