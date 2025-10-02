import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    themeColor: {
      name: String,
      value: String,
      border: String,
    },
    age: String,
    brand: String,
    priceRange: String,
    occupation: String,
    travelMode: String,
    livingStatus: String,
    hobbies: [String],
    location: String,
    pets: String,
    petType: String, // Add this line
    paymentMode: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Profile ||
  mongoose.model("Profile", ProfileSchema);
