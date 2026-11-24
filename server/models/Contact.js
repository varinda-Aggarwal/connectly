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
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    lastContactedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ek user ke andar email unique, sirf active (trash mein nahi) contacts ke liye
contactSchema.index(
  { userId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" }, isDeleted: false },
  }
);

// trash list aur 30 din ke purge ke liye
contactSchema.index({ userId: 1, isDeleted: 1, deletedAt: -1 });

export default mongoose.model("Contact", contactSchema);