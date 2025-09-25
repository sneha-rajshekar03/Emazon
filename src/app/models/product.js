import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    user: String,
    rating: Number,
    comment: String,
  },
  { _id: false }
);

const SellerSchema = new mongoose.Schema(
  {
    seller_name: String,
    seller_rating: Number,
    ships_from: String,
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  imgUrl: String,
  stars: Number,
  price: Number,
  listPrice: Number,
  isBestSeller: Boolean,
  boughtInLastMonth: Number,
  description: String,
  seller_details: SellerSchema,
  customer_reviews: [ReviewSchema],

  // Category info carried over from parent
  category_id: { type: Number, required: true },
  category_name: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
