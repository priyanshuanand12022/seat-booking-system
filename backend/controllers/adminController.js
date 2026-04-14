import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Holiday from "../models/Holiday.js";
import Leave from "../models/Leave.js";
import Seat from "../models/Seat.js";
import User from "../models/User.js";
import { broadcastAvailabilityUpdate } from "../services/socketService.js";
import { withOptionalTransaction } from "../utils/transaction.js";
import { dateKeyToUTCDate, normalizeDateKey, toDateKey } from "../utils/dateUtils.js";
import { SEAT_TYPES, USER_ROLES } from "../utils/constants.js";

export const addHoliday = async (req, res, next) => {
  try {
    const { date, name } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: "Holiday date and name are required." });
    }

    const dateKey = normalizeDateKey(date);
    const normalizedDate = dateKeyToUTCDate(dateKey);

    await withOptionalTransaction(async (session) => {
      const options = session ? { session } : {};

      const existingHoliday = await Holiday.findOne({ date: normalizedDate }, null, options);
      if (existingHoliday) {
        const error = new Error("Holiday already exists for this date.");
        error.statusCode = 409;
        throw error;
      }

      await Holiday.create([{ date: normalizedDate, name }], session ? { session } : {});
      await Booking.deleteMany({ date: normalizedDate }, options);
      await Leave.deleteMany({ date: normalizedDate }, options);
    });

    broadcastAvailabilityUpdate(dateKey);
    return res.status(201).json({ message: "Holiday added and affected bookings cleared." });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const removeHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.holidayId);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    const dateKey = toDateKey(holiday.date);
    await holiday.deleteOne();
    broadcastAvailabilityUpdate(dateKey);

    return res.json({ message: "Holiday removed successfully." });
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (_req, res, next) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ holidays });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const fixedSeats = await Seat.find({ type: SEAT_TYPES.FIXED }).populate("assignedUser", "name email");

    const seatMap = new Map(
      fixedSeats
        .filter((seat) => seat.assignedUser)
        .map((seat) => [seat.assignedUser._id.toString(), { seatId: seat.id, seatLabel: seat.label }])
    );

    res.json({
      users: users.map((user) => ({
        ...user.toJSON(),
        fixedSeat: seatMap.get(user.id) || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { role, batch, squad } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (role) user.role = role;
    if (batch) user.batch = batch;
    if (squad) user.squad = squad;
    await user.save();

    res.json({ message: "User updated successfully.", user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const assignSeat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const seat = await Seat.findById(req.params.seatId);

    if (!seat) {
      return res.status(404).json({ message: "Seat not found." });
    }

    if (seat.type !== SEAT_TYPES.FIXED) {
      return res.status(400).json({ message: "Only fixed seats can be assigned to users." });
    }

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      await Seat.updateMany(
        { assignedUser: userId, _id: { $ne: seat._id }, type: SEAT_TYPES.FIXED },
        { $set: { assignedUser: null } }
      );
      seat.assignedUser = userId;
    } else {
      seat.assignedUser = null;
    }

    await seat.save();

    res.json({ message: "Seat assignment updated successfully.", seat });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (_req, res, next) => {
  try {
    const [overview] = await Booking.aggregate([
      {
        $facet: {
          totals: [{ $count: "totalBookings" }],
          byDate: [
            {
              $group: {
                _id: "$date",
                total: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          bySeat: [
            {
              $group: {
                _id: "$seatId",
                total: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "seats",
                localField: "_id",
                foreignField: "_id",
                as: "seat",
              },
            },
            { $unwind: "$seat" },
          ],
          byUserSquad: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $group: {
                _id: "$user.squad",
                total: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
          ],
          bySeatType: [
            {
              $lookup: {
                from: "seats",
                localField: "seatId",
                foreignField: "_id",
                as: "seat",
              },
            },
            { $unwind: "$seat" },
            {
              $group: {
                _id: "$seat.type",
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const totalBookings = overview?.totals?.[0]?.totalBookings || 0;
    const bookedDatesCount = overview?.byDate?.length || 0;
    const averageDailyBookings = bookedDatesCount ? totalBookings / bookedDatesCount : 0;
    const usageRate = Number(((averageDailyBookings / 50) * 100).toFixed(2));

    res.json({
      totalUsers: await User.countDocuments(),
      totalSeats: await Seat.countDocuments(),
      totalFixedSeats: await Seat.countDocuments({ type: SEAT_TYPES.FIXED }),
      totalFloatingSeats: await Seat.countDocuments({ type: SEAT_TYPES.FLOATING }),
      totalBookings,
      totalAdmins: await User.countDocuments({ role: USER_ROLES.ADMIN }),
      usageRate,
      bookingsByDate: (overview?.byDate || []).map((item) => ({
        date: toDateKey(item._id),
        total: item.total,
      })),
      topSeats: (overview?.bySeat || []).map((item) => ({
        seatId: item.seat._id.toString(),
        label: item.seat.label,
        type: item.seat.type,
        total: item.total,
      })),
      squadUsage: overview?.byUserSquad || [],
      seatTypeUsage: overview?.bySeatType || [],
    });
  } catch (error) {
    if (error instanceof mongoose.Error) {
      return res.status(500).json({ message: "Analytics could not be generated." });
    }
    next(error);
  }
};
