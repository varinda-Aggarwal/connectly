import express from "express";
import { register, login } from "../controllers/authController.js";
import {
  registerValidation,
  loginValidation,
  handleValidation,
} from "../middleware/authValidators.js";

const router = express.Router();

router.post("/register", registerValidation, handleValidation, register);
router.post("/login", loginValidation, handleValidation, login);

export default router;