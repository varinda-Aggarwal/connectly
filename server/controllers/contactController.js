import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import Followup from "../models/Followup.js";
import Interaction from "../models/Interaction.js";
import { deleteFromCloudinary } from "../middleware/upload.js";
import {
  findDuplicates,
  loadContactsForCheck,
  normalizeName,
  normalizePhone,
} from "../utils/duplicateCheck.js";

const duplicateMessage = (dup) => {
  if (dup.inTrash) return "A matching contact is in your Trash";
  if (dup.reason === "email") return "A contact with this email already exists";
  if (dup.reason === "name-phone") return "A contact with the same name and phone number already exists";
  if (dup.reason === "phone") return "This phone number is already saved for another contact";
  return "A contact with this name already exists";
};

const ALLOWED_SORT = ["createdAt", "name", "company"];

const normalizeTags = (tags) => {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(",");
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, company, designation, tags, notes, force } = req.body;
    const photo = req.uploadedPhoto;

    const existingContacts = await loadContactsForCheck(req.user._id);
    const dup = findDuplicates(existingContacts, { name, email, phone });
    if (dup.level === "block" || (dup.level === "warn" && force !== "true")) {
      // photo Cloudinary par upload ho chuki hai, contact save nahi hoga to orphan na rahe
      if (photo) await deleteFromCloudinary(photo.publicId);
      return res.status(409).json({ message: duplicateMessage(dup), ...dup });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name,
      email: email || undefined,
      phone,
      company,
      designation,
      tags: normalizeTags(tags),
      notes,
      photoUrl: photo?.url || "",
      photoPublicId: photo?.publicId || "",
    });

    res.status(201).json(contact);
  } catch (err) {
    // contact save nahi hua to Cloudinary par upload hui photo orphan na rahe
    if (req.uploadedPhoto) await deleteFromCloudinary(req.uploadedPhoto.publicId);

    if (err.code === 11000) {
      return res.status(409).json({ message: "A contact with this email already exists" });
    }
    res.status(500).json({ message: "Could not create contact" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const sortParam = String(req.query.sort || "-createdAt");
    const desc = sortParam.startsWith("-");
    const sortField = desc ? sortParam.slice(1) : sortParam;
    if (!ALLOWED_SORT.includes(sortField)) {
      return res
        .status(400)
        .json({ message: `Sort must be one of: ${ALLOWED_SORT.join(", ")}` });
    }
    const dir = desc ? -1 : 1;

    const filter = { userId: req.user._id, isDeleted: { $ne: true } };

    const search = String(req.query.search || "").trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }];
    }

    const tag = String(req.query.tag || "").trim().toLowerCase();
    if (tag) filter.tags = tag;

    if (req.query.favourite === "true") filter.isFavourite = true;
    if (req.query.recent === "true") {
      filter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // pichhle 7 din
    }

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .sort({ [sortField]: dir, _id: dir })
      .collation({ locale: "en" })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ contacts, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch contacts" });
  }
};

const findOwnContact = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid contact id" });
    return null;
  }
  const contact = await Contact.findOne({ _id: id, userId: req.user._id, isDeleted: { $ne: true } });
  if (!contact) {
    res.status(404).json({ message: "Contact not found" });
    return null;
  }
  return contact;
};

export const getContactById = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) return;
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch contact" });
  }
};

export const updateContact = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) {
      if (req.uploadedPhoto) await deleteFromCloudinary(req.uploadedPhoto.publicId);
      return;
    }

    const { name, email, phone, company, designation, tags, notes, removePhoto, force } = req.body;
    const oldPublicId = contact.photoPublicId;

    // sirf tab check karo jab name, email ya phone badla ho, warna notes edit par bhi warning aati rahegi
    const unchanged =
      normalizeName(name) === normalizeName(contact.name) &&
      String(email || "").trim().toLowerCase() === String(contact.email || "").toLowerCase() &&
      normalizePhone(phone) === normalizePhone(contact.phone);

    if (!unchanged) {
      const existingContacts = await loadContactsForCheck(req.user._id);
      const dup = findDuplicates(existingContacts, { name, email, phone }, contact._id);
      if (dup.level === "block" || (dup.level === "warn" && force !== "true")) {
        if (req.uploadedPhoto) await deleteFromCloudinary(req.uploadedPhoto.publicId);
        return res.status(409).json({ message: duplicateMessage(dup), ...dup });
      }
    }

    contact.name = name;
    contact.email = email || undefined;
    contact.phone = phone;
    contact.company = company;
    contact.designation = designation;
    contact.tags = normalizeTags(tags);
    contact.notes = notes;

    if (req.uploadedPhoto) {
      contact.photoUrl = req.uploadedPhoto.url;
      contact.photoPublicId = req.uploadedPhoto.publicId;
    } else if (removePhoto === "true") {
      contact.photoUrl = "";
      contact.photoPublicId = "";
    }

    await contact.save();

    // purani photo tabhi delete jab DB save successful ho chuka
    if (oldPublicId && oldPublicId !== contact.photoPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    res.json(contact);
  } catch (err) {
    if (req.uploadedPhoto) await deleteFromCloudinary(req.uploadedPhoto.publicId);

    if (err.code === 11000) {
      return res.status(409).json({ message: "A contact with this email already exists" });
    }
    res.status(500).json({ message: "Could not update contact" });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) return;

    // trash mein bhejo: follow-ups, interactions aur photo waise hi rehte hain, restore par wapas mil jate hain
    contact.isDeleted = true;
    contact.deletedAt = new Date();
    await contact.save();

    res.json({ message: "Contact moved to trash" });
  } catch (err) {
    res.status(500).json({ message: "Could not move contact to trash" });
  }
};

export const toggleFavourite = async (req, res) => {
  try {
    const contact = await findOwnContact(req, res);
    if (!contact) return;
    contact.isFavourite = !contact.isFavourite;
    await contact.save();
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: "Could not update favourite" });
  }
};

export const getTags = async (req, res) => {
  try {
    const tags = await Contact.distinct("tags", { userId: req.user._id, isDeleted: { $ne: true } });
    res.json(tags.sort());
  } catch (err) {
    res.status(500).json({ message: "Could not fetch tags" });
  }
};

const TRASH_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// contact hamesha ke liye hatao: follow-ups, interactions aur Cloudinary photo ke saath
const removeContactForever = async (contact) => {
  await Followup.deleteMany({ contactId: contact._id });
  await Interaction.deleteMany({ contactId: contact._id });
  await deleteFromCloudinary(contact.photoPublicId);
  await contact.deleteOne();
};

// 30 din se purane trash contacts delete karo (userId do toh sirf us user ke)
export const purgeExpiredTrash = async (userId) => {
  const filter = {
    isDeleted: true,
    deletedAt: { $lt: new Date(Date.now() - TRASH_DAYS * DAY_MS) },
  };
  if (userId) filter.userId = userId;

  const expired = await Contact.find(filter);
  for (const contact of expired) await removeContactForever(contact);
  return expired.length;
};

const findTrashedContact = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid contact id" });
    return null;
  }
  const contact = await Contact.findOne({ _id: id, userId: req.user._id, isDeleted: true });
  if (!contact) {
    res.status(404).json({ message: "Contact not found in trash" });
    return null;
  }
  return contact;
};

export const getTrash = async (req, res) => {
  try {
    await purgeExpiredTrash(req.user._id);

    const contacts = await Contact.find({ userId: req.user._id, isDeleted: true }).sort({
      deletedAt: -1,
    });

    const items = contacts.map((c) => {
      const deletedAt = c.deletedAt || c.updatedAt || new Date();
      const daysLeft = Math.max(
        Math.ceil((deletedAt.getTime() + TRASH_DAYS * DAY_MS - Date.now()) / DAY_MS),
        0
      );
      return { ...c.toObject(), daysLeft };
    });

    res.json({ contacts: items, total: items.length });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch trash" });
  }
};

export const restoreContact = async (req, res) => {
  try {
    const contact = await findTrashedContact(req, res);
    if (!contact) return;

    contact.isDeleted = false;
    contact.deletedAt = null;
    await contact.save();

    res.json(contact);
  } catch (err) {
    // trash mein rehte hue us email se naya contact ban gaya ho
    if (err.code === 11000) {
      return res.status(409).json({
        message: "An active contact with this email already exists. Edit or delete that one first.",
      });
    }
    res.status(500).json({ message: "Could not restore contact" });
  }
};

export const permanentDeleteContact = async (req, res) => {
  try {
    const contact = await findTrashedContact(req, res);
    if (!contact) return;

    await removeContactForever(contact);
    res.json({ message: "Contact deleted permanently" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete contact permanently" });
  }
};