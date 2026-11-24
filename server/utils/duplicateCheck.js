import Contact from "../models/Contact.js";

export const normalizeName = (name = "") =>
  String(name).trim().toLowerCase().replace(/\s+/g, " ");

// sirf digits rakho; +91 ya 0 se shuru hone par wo hata do; bahut chhota number compare nahi karte
export const normalizePhone = (phone = "") => {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length >= 6 ? digits : "";
};

// user ke saare contacts (trash wale bhi) ek baar mein laao. CSV import mein bhi yahi list use hogi
export const loadContactsForCheck = (userId) =>
  Contact.find({ userId }).select("name email phone company isDeleted").lean();

const matchReason = (existing, { email, nameKey, phoneKey }) => {
  const emailMatch = email && existing.email && existing.email.toLowerCase() === email;
  const phoneMatch = phoneKey && normalizePhone(existing.phone) === phoneKey;
  const nameMatch = nameKey && normalizeName(existing.name) === nameKey;

  if (emailMatch) return "email";
  if (nameMatch && phoneMatch) return "name-phone";
  if (phoneMatch) return "phone";
  if (nameMatch) return "name";
  return null;
};

const RANK = { name: 1, phone: 2, "name-phone": 3, email: 4 };

const publicInfo = (c) => ({
  _id: c._id,
  name: c.name,
  email: c.email || "",
  phone: c.phone || "",
  company: c.company || "",
});

/**
 * level: "block" (same email, ya same name + same phone), "warn" (sirf phone ya sirf name), "none".
 * Trash wale contact se match hone par hamesha "warn" aata hai (inTrash: true), taaki Restore ka option mile.
 */
export const findDuplicates = (existingContacts, candidate, excludeId = null) => {
  const probe = {
    email: String(candidate.email || "").trim().toLowerCase(),
    nameKey: normalizeName(candidate.name),
    phoneKey: normalizePhone(candidate.phone),
  };

  let bestActive = null;
  let bestTrash = null;

  for (const c of existingContacts) {
    if (excludeId && String(c._id) === String(excludeId)) continue;

    const reason = matchReason(c, probe);
    if (!reason) continue;

    if (c.isDeleted) {
      if (!bestTrash || RANK[reason] > RANK[bestTrash.reason]) bestTrash = { reason, contact: c };
    } else if (!bestActive || RANK[reason] > RANK[bestActive.reason]) {
      bestActive = { reason, contact: c };
    }
  }

  if (bestActive) {
    const level = ["email", "name-phone"].includes(bestActive.reason) ? "block" : "warn";
    return { level, reason: bestActive.reason, inTrash: false, contact: publicInfo(bestActive.contact) };
  }
  if (bestTrash) {
    // email ya name+phone trash wale se match ho toh "Add anyway" nahi, sirf Restore
    // (warna naya contact ban jata hai aur purane ko restore karne par email takrati hai)
    const level = ["email", "name-phone"].includes(bestTrash.reason) ? "block" : "warn";
    return { level, reason: bestTrash.reason, inTrash: true, contact: publicInfo(bestTrash.contact) };
  }
  return { level: "none" };
};