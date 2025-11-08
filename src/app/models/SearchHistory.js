// /app/models/SearchHistory.js
import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    default: "Mixed",
  },
  source: {
    type: String,
    enum: ["mongodb", "hybrid_recommender", "python_api"],
    default: "mongodb",
  },
  searchCount: {
    type: Number,
    default: 1,
    min: 1,
  },
  resultsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  searchedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups: find last search by email quickly
searchHistorySchema.index({ email: 1, searchedAt: -1 });
searchHistorySchema.index({ email: 1, lastSearchedAt: -1 });
searchHistorySchema.index({ email: 1, searchCount: -1 });

// Prevent model overwrite in dev (hot reload issue)
export default mongoose.models.SearchHistory ||
  mongoose.model("SearchHistory", searchHistorySchema);
