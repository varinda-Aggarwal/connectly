import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    isFavourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ek user ke andar email unique, lekin sirf jahan email actually diya ho
contactSchema.index(
  { userId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string", $gt: "" } } }
);

export default mongoose.model("Contact", contactSchema);