import express from "express";
import { cancelBooking, createBooking, markLeave, unmarkLeave } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/book", protect, createBooking);
router.post("/cancel", protect, cancelBooking);
router.post("/leave", protect, markLeave);
router.post("/leave/unmark", protect, unmarkLeave);

export default router;
