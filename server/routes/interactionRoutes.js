import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getInteractions,
  createInteraction,
  deleteInteraction,
} from "../controllers/interactionController.js";

const router = express.Router();

router.get("/contacts/:contactId/interactions", protect, getInteractions);
router.post("/contacts/:contactId/interactions", protect, createInteraction);
router.delete("/interactions/:id", protect, deleteInteraction);

export default router;