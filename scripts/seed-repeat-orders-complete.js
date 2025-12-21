// scripts/seed-repeat-orders-complete.js
// This version creates BOTH products AND purchases

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

// Schemas
const productSchema = new mongoose.Schema({
  product_id: { type: String, unique: true },
  title: String,
  price: Number,
  category: String,
  image: String,
  description: String,
  stock: Number,
});

const purchaseHistorySchema = new mongoose.Schema({
  user_id: String,
  purchase_id: String,
  transaction_date: Date,
  items: [
    {
      product_id: String,
      title: String,
      price: Number,
      quantity: Number,
      category: String,
    },
  ],
  total_amount: Number,
  payment_method: String,
  status: String,
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
const PurchaseHistory =
  mongoose.models.PurchaseHistory ||
  mongoose.model("PurchaseHistory", purchaseHistorySchema);

async function seedCompleteData(userId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test products with repeat-order friendly intervals
    const products = [
      {
        product_id: "MILK-001",
        title: "Organic Whole Milk (1L)",
        price: 5.99,
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
        description: "Fresh organic whole milk from local farms",
        stock: 100,
        interval: 7, // Weekly
      },
      {
        product_id: "COFFEE-001",
        title: "Colombian Coffee Beans (500g)",
        price: 12.99,
        category: "Beverages",
        image:
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
        description: "Premium Colombian arabica coffee beans",
        stock: 50,
        interval: 14, // Bi-weekly
      },
      {
        product_id: "BREAD-001",
        title: "Artisan Whole Wheat Bread",
        price: 3.49,
        category: "Bakery",
        image:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        description: "Freshly baked whole wheat bread",
        stock: 75,
        interval: 3, // Too frequent (will be filtered)
      },
      {
        product_id: "SHAMPOO-001",
        title: "Herbal Essence Shampoo (400ml)",
        price: 8.99,
        category: "Personal Care",
        image:
          "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400",
        description: "Natural herbal shampoo for all hair types",
        stock: 60,
        interval: 30, // Monthly
      },
      {
        product_id: "SNACKS-001",
        title: "Protein Bars Box (12 pack)",
        price: 24.99,
        category: "Snacks",
        image:
          "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400",
        description: "Mixed flavor protein bars with 20g protein each",
        stock: 40,
        interval: 21, // Every 3 weeks
      },
    ];

    console.log("🌱 Step 1: Creating/Updating Products");
    console.log("=====================================\n");

    for (const product of products) {
      const { interval, ...productData } = product;

      await Product.findOneAndUpdate(
        { product_id: product.product_id },
        productData,
        { upsert: true, new: true }
      );

      console.log(`✅ Product: ${product.title}`);
    }

    console.log("\n🌱 Step 2: Creating Purchase History");
    console.log("=====================================\n");

    const today = new Date();
    const purchases = [];

    for (const product of products) {
      console.log(`📦 ${product.title} (Every ${product.interval} days)`);

      // Create 5 purchases going back in time
      for (let i = 4; i >= 0; i--) {
        const purchaseDate = new Date(today);
        purchaseDate.setDate(purchaseDate.getDate() - product.interval * i);

        const purchase = {
          user_id: userId,
          purchase_id: `TEST-${product.product_id}-${Date.now()}-${i}`,
          transaction_date: purchaseDate,
          items: [
            {
              product_id: product.product_id,
              title: product.title,
              price: product.price,
              quantity: 1,
              category: product.category,
            },
          ],
          total_amount: product.price,
          payment_method: "upi",
          status: "completed",
        };

        purchases.push(purchase);
        console.log(`   ${purchaseDate.toISOString().split("T")[0]}`);
      }
      console.log();
    }

    // Delete old test purchases
    const deleteResult = await PurchaseHistory.deleteMany({
      user_id: userId,
      purchase_id: { $regex: /^TEST-/ },
    });
    console.log(
      `🗑️  Removed ${deleteResult.deletedCount} old test purchases\n`
    );

    // Insert new purchases
    await PurchaseHistory.insertMany(purchases);

    console.log("=====================================");
    console.log("✅ SEEDING COMPLETE!");
    console.log("=====================================\n");

    console.log("📊 Summary:");
    console.log(`   User ID: ${userId}`);
    console.log(`   Products created: ${products.length}`);
    console.log(`   Purchases created: ${purchases.length}`);
    console.log(
      `   Date range: ${
        purchases[purchases.length - 1].transaction_date
          .toISOString()
          .split("T")[0]
      } → ${today.toISOString().split("T")[0]}\n`
    );

    // Calculate which products should be eligible TODAY
    console.log(
      "🔍 Expected Results (Today: " + today.toISOString().split("T")[0] + "):"
    );
    console.log("=====================================");

    for (const product of products) {
      const lastPurchase = new Date(today);
      lastPurchase.setDate(lastPurchase.getDate() - 0); // Most recent was today

      const expectedNext = new Date(lastPurchase);
      expectedNext.setDate(expectedNext.getDate() + product.interval);

      const daysUntil = Math.floor((expectedNext - today) / 86400000);
      const inWindow = daysUntil >= -3 && daysUntil <= 3;
      const tooFrequent = product.interval < 7;

      let status;
      if (tooFrequent) {
        status = "❌ FILTERED (too frequent)";
      } else if (inWindow) {
        status = "✅ ELIGIBLE (in window)";
      } else {
        status = `⏳ WAIT ${Math.abs(daysUntil)} days`;
      }

      console.log(`${status}`);
      console.log(`   Product: ${product.title}`);
      console.log(
        `   Expected next: ${
          expectedNext.toISOString().split("T")[0]
        } (${daysUntil} days)`
      );
      console.log();
    }

    console.log("🧪 Next Steps:");
    console.log("=====================================");
    console.log("1. Visit: http://localhost:3000/api/debug-repeat-patterns");
    console.log("   → Should show detailed analysis\n");
    console.log(
      "2. Visit: http://localhost:3000/api/repeat-suggestions?cartProductIds=[]"
    );
    console.log("   → Should return eligible suggestions\n");
    console.log("3. Go to: http://localhost:3000/Cart");
    console.log("   → Slider should appear in top-right!\n");

    console.log("💡 Tips:");
    console.log(
      "   • If no suggestions appear, the products might not be in reorder window yet"
    );
    console.log(
      "   • Wait a few days, or adjust the mock date in repeat-suggestions/route.js"
    );
    console.log("   • Check server console logs for detailed debugging\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: Please provide a user ID\n");
  console.log(
    "Usage: node scripts/seed-repeat-orders-complete.js YOUR_USER_ID"
  );
  console.log(
    "Example: node scripts/seed-repeat-orders-complete.js 6910dff2022cea9f1088458c\n"
  );
  process.exit(1);
}

seedCompleteData(userId);
