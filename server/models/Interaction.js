import mongoose from "mongoose";

export const INTERACTION_TYPES = ["call", "meeting", "email", "note"];

const interactionSchema = new mongoose.Schema(
  {
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: INTERACTION_TYPES, required: true },
    date: { type: Date, default: Date.now },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    outcome: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

interactionSchema.index({ contactId: 1, date: -1 });
interactionSchema.index({ userId: 1 });

export default mongoose.model("Interaction", interactionSchema);