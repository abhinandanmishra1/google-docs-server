import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  googleId: String,
  email: String,
  name: String,
  refreshToken: String,
  picture: String
});

const Users = model("Users", UserSchema);

export default Users;
