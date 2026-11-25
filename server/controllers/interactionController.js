import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import Interaction, { INTERACTION_TYPES } from "../models/Interaction.js";

// contact ka lastContactedAt hamesha uski sabse nayi interaction ki date hota hai
const syncLastContacted = async (contactId) => {
  const latest = await Interaction.findOne({ contactId }).sort({ date: -1 }).select("date");
  await Contact.updateOne({ _id: contactId }, { lastContactedAt: latest ? latest.date : null });
};

const findOwnContact = async (req, res) => {
  const { contactId } = req.params;
  if (!mongoose.isValidObjectId(contactId)) {
    res.status(400).json({ message: "Invalid contact id" });
    return null;
  }
  const contact = await Contact.findOne({
  _id: contactId,
  userId: req.user._id,
  isDeleted: { $ne: true },
});
  if (!contact) {
    res.status(404).json({ message: "Contact not found" });
    return null;
  }
  return contact;
};

export const getInteractions = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) return;

    const interactions = await Interaction.find({ contactId: contact._id, userId: req.user._id })
      .sort({ date: -1, _id: -1 })
      .limit(100);
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch interactions" });
  }
};

export const createInteraction = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) return;

    const { type, date, summary, outcome } = req.body;

    if (!INTERACTION_TYPES.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${INTERACTION_TYPES.join(", ")}` });
    }

    const text = String(summary || "").trim();
    if (!text) return res.status(400).json({ message: "Summary is required" });
    if (text.length > 500) {
      return res.status(400).json({ message: "Summary must be 500 characters or fewer" });
    }

    const when = date ? new Date(date) : new Date();
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ message: "Enter a valid date and time" });
    }
    if (when.getTime() > Date.now() + 5 * 60 * 1000) {
      return res.status(400).json({ message: "Interaction date cannot be in the future" });
    }

    const interaction = await Interaction.create({
      contactId: contact._id,
      userId: req.user._id,
      type,
      date: when,
      summary: text,
      outcome: String(outcome || "").trim().slice(0, 200),
    });

    await syncLastContacted(contact._id);
    res.status(201).json(interaction);
  } catch (err) {
    res.status(500).json({ message: "Could not save the interaction" });
  }
};

export const deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid interaction id" });
    }

    const interaction = await Interaction.findOne({ _id: id, userId: req.user._id });
    if (!interaction) return res.status(404).json({ message: "Interaction not found" });

    await interaction.deleteOne();
    await syncLastContacted(interaction.contactId);
    res.json({ message: "Interaction deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete interaction" });
  }
};