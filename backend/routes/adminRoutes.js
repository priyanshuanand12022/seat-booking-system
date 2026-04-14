import express from "express";
import {
  addHoliday,
  assignSeat,
  getAnalytics,
  getHolidays,
  getUsers,
  removeHoliday,
  updateUser,
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.post("/holiday", addHoliday);
router.get("/holidays", getHolidays);
router.delete("/holiday/:holidayId", removeHoliday);
router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.patch("/users/:userId", updateUser);
router.patch("/seats/:seatId/assignment", assignSeat);

export default router;
