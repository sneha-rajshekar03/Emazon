import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  query: { type: String, required: true },
  category: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now, index: true },
});

// Index for faster lookups: find last search by email quickly
searchHistorySchema.index({ email: 1, searchedAt: -1 });

// Prevent model overwrite in dev (hot reload issue)
export default mongoose.models.SearchHistory ||
  mongoose.model("SearchHistory", searchHistorySchema);
