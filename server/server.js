import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import csvRoutes from "./routes/csvRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import followupRoutes from "./routes/followupRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { purgeExpiredTrash } from "./controllers/contactController.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, exposedHeaders: ["Content-Disposition"] }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/contacts", csvRoutes);      // contactRoutes se pehle
app.use("/api/contacts", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/followups", followupRoutes);
app.use("/api", interactionRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const runTrashPurge = async () => {
  try {
    const removed = await purgeExpiredTrash();
    if (removed) console.log(`Trash purge: ${removed} expired contact(s) removed`);
  } catch (err) {
    console.error("Trash purge failed:", err.message);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  runTrashPurge(); // server start par
  setInterval(runTrashPurge, 24 * 60 * 60 * 1000); // uske baad roz ek baar
});