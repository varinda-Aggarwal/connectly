import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerValidation,
  loginValidation,
  handleValidation,
} from "../middleware/authValidators.js";

const router = express.Router();

router.post("/register", registerValidation, handleValidation, register);
router.post("/login", loginValidation, handleValidation, login);
router.get("/me", protect, getMe);

export default router;