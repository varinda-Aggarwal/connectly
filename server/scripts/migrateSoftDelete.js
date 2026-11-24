import "dotenv/config";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";

await mongoose.connect(process.env.MONGO_URI);

const res = await Contact.updateMany(
  { isDeleted: { $exists: false } },
  { $set: { isDeleted: false, deletedAt: null } }
);
console.log(`Contacts updated: ${res.modifiedCount}`);

await Contact.syncIndexes();
console.log("Indexes synced");

await mongoose.disconnect();