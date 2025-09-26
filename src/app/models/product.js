// /app/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  category_id: Number,
  category_name: String,
  product_id: String,
  title: String,
  imgUrl: String,
  stars: Number,
  price: Number,
  listPrice: Number,
  isBestSeller: Boolean,
  boughtInLastMonth: Number,
  description: String,
  seller_details: {
    seller_name: String,
    seller_rating: Number,
    ships_from: String,
  },
  customer_reviews: [
    {
      user: String,
      rating: Number,
      comment: String,
    },
  ],
});

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
