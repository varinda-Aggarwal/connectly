import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import Followup from "../models/Followup.js";

export const getFollowups = async (req, res) => {
  try {
    const { contactId } = req.query;
    const filter = { userId: req.user._id };

    if (contactId) {
      if (!mongoose.isValidObjectId(contactId)) {
        return res.status(400).json({ message: "Invalid contact id" });
      }
      filter.contactId = contactId;
    } else {
      filter.isDone = false;
    }

    const followups = await Followup.find(filter).sort({ isDone: 1, dueAt: 1 });
    res.json(followups);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch follow-ups" });
  }
};

export const createFollowup = async (req, res) => {
  try {
    const { contactId, note, dueAt } = req.body;

    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(400).json({ message: "Invalid contact id" });
    }
    if (!note || !String(note).trim()) {
      return res.status(400).json({ message: "Note is required" });
    }
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) {
      return res.status(400).json({ message: "Enter a valid date and time" });
    }

    const contact = await Contact.findOne({ _id: contactId, userId: req.user._id });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    const followup = await Followup.create({
      userId: req.user._id,
      contactId,
      note: String(note).trim(),
      dueAt: due,
    });
    res.status(201).json(followup);
  } catch (err) {
    res.status(500).json({ message: "Could not create follow-up" });
  }
};

const findOwnFollowup = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid follow-up id" });
    return null;
  }
  const followup = await Followup.findOne({ _id: id, userId: req.user._id });
  if (!followup) {
    res.status(404).json({ message: "Follow-up not found" });
    return null;
  }
  return followup;
};

export const toggleFollowupDone = async (req, res) => {
  try {
    const followup = await findOwnFollowup(req, res);
    if (!followup) return;
    followup.isDone = !followup.isDone;
    await followup.save();
    res.json(followup);
  } catch (err) {
    res.status(500).json({ message: "Could not update follow-up" });
  }
};

export const deleteFollowup = async (req, res) => {
  try {
    const followup = await findOwnFollowup(req, res);
    if (!followup) return;
    await followup.deleteOne();
    res.json({ message: "Follow-up deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete follow-up" });
  }
};