import mongoose from "mongoose";

const PurchaseHistorySchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  transaction_date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  items: [
    {
      product_id: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit_price: { type: Number, required: true },
    },
  ],
  total_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
  device_type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "completed",
    required: true,
  },
});

const PurchaseHistory =
  mongoose.models.PurchaseHistory ||
  mongoose.model("PurchaseHistory", PurchaseHistorySchema);

export default PurchaseHistory;
