import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // can be email or actual userId
  email: { type: String, required: true },
  query: { type: String, required: true },
  category: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
});

// Prevent model overwrite during hot reload in dev
export default mongoose.models.SearchHistory ||
  mongoose.model("SearchHistory", searchHistorySchema);
