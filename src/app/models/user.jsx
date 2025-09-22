import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  image: { type: String },
});

const User = models.User || model("User", UserSchema);
export default User;
