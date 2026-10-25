import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import { deleteFromCloudinary } from "../middleware/upload.js";

const ALLOWED_SORT = ["createdAt", "name", "company"];

const normalizeTags = (tags) => {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(",");
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, company, designation, tags, notes } = req.body;
    const photo = req.uploadedPhoto;

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

    const filter = { userId: req.user._id };

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
  const contact = await Contact.findOne({ _id: id, userId: req.user._id });
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

    const { name, email, phone, company, designation, tags, notes, removePhoto } = req.body;
    const oldPublicId = contact.photoPublicId;

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

    const publicId = contact.photoPublicId;
    await contact.deleteOne();
    await deleteFromCloudinary(publicId);

    res.json({ message: "Contact deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete contact" });
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
    const tags = await Contact.distinct("tags", { userId: req.user._id });
    res.json(tags.sort());
  } catch (err) {
    res.status(500).json({ message: "Could not fetch tags" });
  }
};