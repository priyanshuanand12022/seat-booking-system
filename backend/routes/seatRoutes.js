import express from "express";
import { getAvailability, getSeats } from "../controllers/seatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSeats);
router.get("/availability", protect, getAvailability);

export default router;
