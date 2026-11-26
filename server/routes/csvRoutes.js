import express from "express";
import { exportContacts, importContacts } from "../controllers/csvController.js";
import { protect } from "../middleware/authMiddleware.js";
import { csvUpload } from "../middleware/csvUpload.js";

const router = express.Router();

// protect har route par alag se, router.use nahi: yeh router /api/contacts par contactRoutes se pehle lagta hai
router.get("/export", protect, exportContacts);
router.post("/import", protect, csvUpload, importContacts);

export default router;