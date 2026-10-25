import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";

const run = async () => {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: node scripts/seed.js <registered-user-email>");

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found, pehle app mein register karo");

  const tagPool = ["client", "friend", "work", "family", "vendor"];

  const contacts = Array.from({ length: 40 }, (_, i) => ({
    userId: user._id,
    name: faker.person.fullName(),
    email: `${faker.internet.username().toLowerCase()}${i}@example.com`,
    phone: faker.phone.number(),
    company: faker.company.name(),
    designation: faker.person.jobTitle(),
    tags: faker.helpers.arrayElements(tagPool, { min: 1, max: 2 }),
    notes: faker.lorem.sentence(),
    isFavourite: faker.datatype.boolean(0.2),
  }));

  await Contact.insertMany(contacts);
  console.log(`Seeded ${contacts.length} contacts for ${email}`);
  await mongoose.connection.close();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});