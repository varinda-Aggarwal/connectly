import express from "express";
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  toggleFavourite,
} from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { contactValidation } from "../middleware/contactValidators.js";
import { handleValidation } from "../middleware/authValidators.js";

const router = express.Router();

router.use(protect);

router.get("/", getContacts);
router.post("/", contactValidation, handleValidation, createContact);
router.get("/:id", getContactById);
router.put("/:id", contactValidation, handleValidation, updateContact);
router.delete("/:id", deleteContact);
router.patch("/:id/favourite", toggleFavourite);

export default router;