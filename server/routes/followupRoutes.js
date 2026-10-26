import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFollowups,
  createFollowup,
  toggleFollowupDone,
  deleteFollowup,
} from "../controllers/followupController.js";

const router = express.Router();

router.use(protect);

router.get("/", getFollowups);
router.post("/", createFollowup);
router.patch("/:id/done", toggleFollowupDone);
router.delete("/:id", deleteFollowup);

export default router;