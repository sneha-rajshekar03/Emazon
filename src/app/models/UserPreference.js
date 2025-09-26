import mongoose from "mongoose";

const PreferenceEntrySchema = new mongoose.Schema({
  element: { type: String, required: true }, // e.g. "images", "description", "reviews"
  score: { type: Number, default: 0 },
});

const UserPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  preferences: { type: [PreferenceEntrySchema], default: [] },
});

export default mongoose.models.UserPreference ||
  mongoose.model("UserPreference", UserPreferenceSchema);
