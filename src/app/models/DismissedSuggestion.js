// models/DismissedSuggestion.js
import mongoose from "mongoose";

const DismissedSuggestionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    product_id: {
      type: String,
      required: true,
    },
    dismissed_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    cycle_start: {
      type: Date,
      required: true,
    },
    cycle_end: {
      type: Date,
      required: true,
      index: true,
    },
    expected_next_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
DismissedSuggestionSchema.index({
  user_id: 1,
  product_id: 1,
  cycle_end: 1,
});

// Index for TTL (auto-delete after 180 days)
DismissedSuggestionSchema.index(
  { cycle_end: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 }
);

const DismissedSuggestion =
  mongoose.models.DismissedSuggestion ||
  mongoose.model("DismissedSuggestion", DismissedSuggestionSchema);

export default DismissedSuggestion;
