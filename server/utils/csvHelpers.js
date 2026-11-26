// CSV injection: =, +, -, @ (aur tab/CR) se shuru hone wale cell Excel mein formula ban sakte hain
const FORMULA_CHARS = ["=", "+", "-", "@", "\t", "\r"];

export const escapeCell = (value) => {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (s && FORMULA_CHARS.includes(s[0])) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// BOM se Excel UTF-8 (Hindi naam, etc.) sahi dikhata hai
export const toCsv = (rows, columns) => {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.get(row))).join(","));
  return "\uFEFF" + [head, ...lines].join("\r\n") + "\r\n";
};

// export mein lagaya gaya ' wapas hatao, taaki export -> import par data wahi rahe
const unescapeCell = (s) => s.replace(/^'(?=[=+\-@\t\r])/, "");

const HEADER_ALIASES = {
  name: ["name", "fullname", "contactname"],
  email: ["email", "emailaddress", "mail"],
  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contactnumber"],
  company: ["company", "organization", "organisation", "companyname"],
  designation: ["designation", "title", "jobtitle", "role"],
  tags: ["tags", "tag", "labels"],
  notes: ["notes", "note", "remarks"],
};

export const normalizeHeader = (h) => {
  const key = String(h || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key)) return field;
  }
  return key;
};

const parseTags = (value) => [
  ...new Set(
    value
      .split(/[;,|]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  ),
].slice(0, 10);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ek CSV row ko saaf karo aur validate karo. errors khaali ho toh row theek hai
export const cleanRow = (raw) => {
  const get = (k) => unescapeCell(String(raw[k] ?? "").trim());

  const data = {
    name: get("name"),
    email: get("email").toLowerCase(),
    phone: get("phone"),
    company: get("company"),
    designation: get("designation"),
    notes: get("notes"),
    tags: parseTags(get("tags")),
  };

  const errors = [];
  if (!data.name) errors.push("Name is required");
  else if (data.name.length > 100) errors.push("Name is too long (max 100)");

  if (data.email && (data.email.length > 254 || !EMAIL_RX.test(data.email))) {
    errors.push("Invalid email");
  }

  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (!/^[\d\s+\-()]+$/.test(data.phone) || digits.length < 6 || digits.length > 15) {
      errors.push("Invalid phone number");
    }
  }

  if (data.company.length > 100) errors.push("Company is too long (max 100)");
  if (data.designation.length > 100) errors.push("Designation is too long (max 100)");
  if (data.notes.length > 1000) errors.push("Notes are too long (max 1000)");

  return { data, errors };
};