import { Schema, model, models } from "mongoose";

const CartSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  items: [
    {
      _id: false, // ✅ CRITICAL FIX: Prevent MongoDB from adding _id to array items
      product_id: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
      image: String,
      category_name: String,
    },
  ],
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at timestamp on save
CartSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Cart = models.Cart || model("Cart", CartSchema);

export default Cart;
