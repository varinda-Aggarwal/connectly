import express from "express";
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  toggleFavourite,
  getTags,
} from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { contactValidation } from "../middleware/contactValidators.js";
import { handleValidation } from "../middleware/authValidators.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", getContacts);
router.get("/tags", getTags);
router.post("/", contactValidation, handleValidation, createContact);
router.get("/:id", getContactById);
router.put("/:id", contactValidation, handleValidation, updateContact);
router.delete("/:id", deleteContact);
router.patch("/:id/favourite", toggleFavourite);
router.post("/", upload, contactValidation, handleValidation, uploadToCloudinary, createContact);
router.put("/:id", upload, contactValidation, handleValidation, uploadToCloudinary, updateContact);

export default router;