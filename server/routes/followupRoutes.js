import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getFollowups,
  createFollowup,
  updateFollowup,
  toggleFollowupDone,
  deleteFollowup,
} from "../controllers/followupController.js";

const router = express.Router();

router.use(protect);

router.get("/", getFollowups);
router.post("/", createFollowup);
router.patch("/:id", updateFollowup);
router.patch("/:id/done", toggleFollowupDone);
router.delete("/:id", deleteFollowup);

export default router;