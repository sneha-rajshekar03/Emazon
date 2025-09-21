import mongoose from "mongoose";
let isConnected = false;
export const connectTODB = async () => {
  if (isConnected) {
    console.log("mongoDB connected");
    return;
  }
  try {
    console.log("monogo_uri:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONOGODB_URI, {
      dbName: "Emzon",
      usenewURLParser: true,
      useUnifiedTopoLogy: true,
    });
    isConnected = true;
    console.log("MOngoDB connected");
  } catch (error) {
    console.log(error);
  }
};
