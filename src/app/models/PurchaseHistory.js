import mongoose from "mongoose";

const PurchaseHistorySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  items: [
    {
      product_id: { type: String, required: true },
      title: { type: String, required: true }, // Changed from name
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: String,
      category_name: String,
    },
  ],
  total_amount: {
    type: Number,
    required: true,
  },
  purchase_date: {
    type: Date,
    default: Date.now,
  },
});

const PurchaseHistory =
  mongoose.models.PurchaseHistory ||
  mongoose.model("PurchaseHistory", PurchaseHistorySchema);

export default PurchaseHistory;
