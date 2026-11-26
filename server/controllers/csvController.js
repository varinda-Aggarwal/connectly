import { parse } from "csv-parse/sync";
import Contact from "../models/Contact.js";
import { findDuplicates, loadContactsForCheck } from "../utils/duplicateCheck.js";
import { toCsv, normalizeHeader, cleanRow } from "../utils/csvHelpers.js";

const MAX_EXPORT = 5000;
const MAX_IMPORT_ROWS = 500;
const CHUNK = 25;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EXPORT_COLUMNS = [
  { header: "Name", get: (c) => c.name },
  { header: "Email", get: (c) => c.email },
  { header: "Phone", get: (c) => c.phone },
  { header: "Company", get: (c) => c.company },
  { header: "Designation", get: (c) => c.designation },
  { header: "Tags", get: (c) => (c.tags || []).join("; ") },
  { header: "Notes", get: (c) => c.notes },
  { header: "Favourite", get: (c) => (c.isFavourite ? "yes" : "no") },
  { header: "Created At", get: (c) => c.createdAt },
];

// getContacts jaisa hi filter, taaki export wahi de jo list mein dikh raha hai
export const exportContacts = async (req, res) => {
  try {
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
      filter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(MAX_EXPORT)
      .lean();

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="contacts-${date}.csv"`);
    res.send(toCsv(contacts, EXPORT_COLUMNS));
  } catch (err) {
    res.status(500).json({ message: "Could not export contacts" });
  }
};

const REASON_TEXT = {
  email: "same email",
  "name-phone": "same name and phone number",
  phone: "same phone number",
  name: "same name",
};

const duplicateText = (dup) => {
  const id = dup.contact._id;
  // file ke andar ki row ko hum "row-N" id dete hain (neeche dekho)
  const where =
    typeof id === "string" && id.startsWith("row-")
      ? `row ${id.slice(4)} of this file`
      : dup.inTrash
      ? "a contact in your Trash (restore it from there)"
      : "an existing contact";
  return `Duplicate: ${REASON_TEXT[dup.reason]} as ${where}`;
};

export const importContacts = async (req, res) => {
  try {
    const force = req.body?.force === "true"; // true ho toh sirf "warn" wale duplicates bhi import honge

    let records;
    try {
      records = parse(req.file.buffer, {
        columns: (header) => header.map(normalizeHeader),
        bom: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err) {
      return res.status(400).json({ message: `Could not read the CSV file: ${err.message}` });
    }

    if (records.length === 0) {
      return res.status(400).json({ message: "The CSV file has no data rows" });
    }
    if (!("name" in records[0])) {
      return res.status(400).json({ message: 'The CSV file must have a "Name" column' });
    }
    if (records.length > MAX_IMPORT_ROWS) {
      return res
        .status(400)
        .json({ message: `Too many rows (${records.length}). Maximum is ${MAX_IMPORT_ROWS} per import` });
    }

    const existing = await loadContactsForCheck(req.user._id); // trash wale bhi
    const toInsert = [];
    const errors = [];
    let skipped = 0;
    let failed = 0;

    records.forEach((raw, i) => {
      const row = i + 2; // row 1 header hai
      const { data, errors: rowErrors } = cleanRow(raw);

      if (rowErrors.length) {
        failed++;
        errors.push({ row, name: data.name, status: "failed", reason: rowErrors.join("; ") });
        return;
      }

      // database ke saath bhi aur file ki pichhli rows ke saath bhi
      const dup = findDuplicates(existing, data);
      if (dup.level === "block" || (dup.level === "warn" && !force)) {
        skipped++;
        errors.push({ row, name: data.name, status: "skipped", reason: duplicateText(dup) });
        return;
      }

      existing.push({ _id: `row-${row}`, ...data, isDeleted: false });
      toInsert.push({ row, data });
    });

    let imported = 0;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        chunk.map(({ data }) =>
          Contact.create({ userId: req.user._id, ...data, email: data.email || undefined })
        )
      );

      results.forEach((r, idx) => {
        const { row, data } = chunk[idx];
        if (r.status === "fulfilled") {
          imported++;
        } else if (r.reason?.code === 11000) {
          skipped++;
          errors.push({ row, name: data.name, status: "skipped", reason: "Duplicate: same email as an existing contact" });
        } else {
          failed++;
          errors.push({ row, name: data.name, status: "failed", reason: "Could not save this row" });
        }
      });
    }

    errors.sort((a, b) => a.row - b.row);
    res.json({ total: records.length, imported, skipped, failed, errors });
  } catch (err) {
    res.status(500).json({ message: "Could not import contacts" });
  }
};
