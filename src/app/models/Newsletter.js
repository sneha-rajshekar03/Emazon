// app/models/Newsletter.js
import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    source: {
      type: String,
      default: "newsletter",
      enum: ["newsletter", "checkout", "popup", "other"],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create index for faster email lookups
NewsletterSchema.index({ email: 1 });

// Prevent duplicate model compilation in development
const Newsletter =
  mongoose.models.Newsletter || mongoose.model("Newsletter", NewsletterSchema);

export default Newsletter;
