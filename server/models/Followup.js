import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true },
    note: { type: String, required: true, trim: true, maxlength: 200 },
    dueAt: { type: Date, required: true },
    isDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

followupSchema.index({ userId: 1, isDone: 1, dueAt: 1 });
followupSchema.index({ contactId: 1 });

export default mongoose.model("Followup", followupSchema);