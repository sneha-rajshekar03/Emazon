import mongoose from "mongoose";

const RecentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        product_id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        imgUrl: {
          type: String,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
RecentlyViewedSchema.index({ userId: 1, "products.viewedAt": -1 });

export default mongoose.models.RecentlyViewed ||
  mongoose.model("RecentlyViewed", RecentlyViewedSchema);
