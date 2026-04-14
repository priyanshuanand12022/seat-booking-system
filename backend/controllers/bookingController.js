import Booking from "../models/Booking.js";
import Holiday from "../models/Holiday.js";
import Leave from "../models/Leave.js";
import Seat from "../models/Seat.js";
import { broadcastAvailabilityUpdate } from "../services/socketService.js";
import { withOptionalTransaction } from "../utils/transaction.js";
import {
  dateKeyToUTCDate,
  getBookingOpenDateKey,
  getNowInAppZone,
  isBatchDesignatedDay,
  isPastDateKey,
  isWorkingDay,
  normalizeDateKey,
  toDateKey,
} from "../utils/dateUtils.js";
import { SEAT_TYPES, USER_ROLES } from "../utils/constants.js";

const getHolidayKeySet = async () => {
  const holidays = await Holiday.find();
  return new Set(holidays.map((holiday) => toDateKey(holiday.date)));
};

const ensureSeatEligibility = ({ seat, user, dateKey }) => {
  if (seat.type === SEAT_TYPES.FLOATING) {
    return;
  }

  if (!seat.assignedUser) {
    const error = new Error("This fixed seat has not been assigned yet.");
    error.statusCode = 400;
    throw error;
  }

  if (seat.assignedUser.toString() !== user.id) {
    const error = new Error("This fixed seat is assigned to another employee.");
    error.statusCode = 400;
    throw error;
  }

  if (!isBatchDesignatedDay(user.batch, dateKey)) {
    const error = new Error("Your fixed seat is available only on designated batch days.");
    error.statusCode = 400;
    throw error;
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { seatId, date } = req.body;

    if (!seatId || !date) {
      return res.status(400).json({ message: "Seat and date are required." });
    }

    const holidayKeys = await getHolidayKeySet();
    const requestedDateKey = normalizeDateKey(date);
    const bookingOpenDateKey = getBookingOpenDateKey(getNowInAppZone(), holidayKeys);

    if (!bookingOpenDateKey || requestedDateKey !== bookingOpenDateKey) {
      return res.status(400).json({
        message: "Bookings open after 3:00 PM and only for the next working day.",
      });
    }

    if (!isWorkingDay(requestedDateKey, holidayKeys)) {
      return res.status(400).json({ message: "Bookings are not allowed on holidays or weekends." });
    }

    const normalizedDate = dateKeyToUTCDate(requestedDateKey);

    const booking = await withOptionalTransaction(async (session) => {
      const sessionOptions = session ? { session } : {};

      const [seat, existingUserBooking, existingSeatBooking, leave] = await Promise.all([
        Seat.findById(seatId, null, sessionOptions),
        Booking.findOne({ userId: req.user._id, date: normalizedDate }, null, sessionOptions),
        Booking.findOne({ seatId, date: normalizedDate }, null, sessionOptions),
        Leave.findOne({ userId: req.user._id, date: normalizedDate }, null, sessionOptions),
      ]);

      if (!seat) {
        const error = new Error("Seat not found.");
        error.statusCode = 404;
        throw error;
      }

      if (leave) {
        const error = new Error("You already marked leave for this day.");
        error.statusCode = 400;
        throw error;
      }

      if (existingUserBooking) {
        const error = new Error("You already have a booking for this day.");
        error.statusCode = 409;
        throw error;
      }

      if (existingSeatBooking) {
        const error = new Error("This seat has already been booked.");
        error.statusCode = 409;
        throw error;
      }

      // Eligibility is checked inside the same booking unit to avoid stale reads during concurrent requests.
      ensureSeatEligibility({ seat, user: req.user, dateKey: requestedDateKey });

      const [createdBooking] = await Booking.create(
        [
          {
            userId: req.user._id,
            seatId,
            date: normalizedDate,
          },
        ],
        session ? { session } : {}
      );

      return createdBooking;
    });

    broadcastAvailabilityUpdate(requestedDateKey);
    return res.status(201).json({ message: "Seat booked successfully.", booking });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "The seat or date was booked by another request. Please refresh and try again." });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { seatId, date } = req.body;

    if (!seatId || !date) {
      return res.status(400).json({ message: "Seat and date are required." });
    }

    const requestedDateKey = normalizeDateKey(date);
    const normalizedDate = dateKeyToUTCDate(requestedDateKey);

    const booking = await Booking.findOne({
      seatId,
      date: normalizedDate,
      ...(req.user.role === USER_ROLES.ADMIN ? {} : { userId: req.user._id }),
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    await booking.deleteOne();
    broadcastAvailabilityUpdate(requestedDateKey);

    return res.json({ message: "Booking cancelled successfully." });
  } catch (error) {
    next(error);
  }
};

export const markLeave = async (req, res, next) => {
  try {
    const { date, note = "" } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const requestedDateKey = normalizeDateKey(date);
    const holidayKeys = await getHolidayKeySet();

    if (!isWorkingDay(requestedDateKey, holidayKeys)) {
      return res.status(400).json({ message: "Leave can only be marked for a working day." });
    }

    if (isPastDateKey(requestedDateKey)) {
      return res.status(400).json({ message: "Leave cannot be marked for a past date." });
    }

    const normalizedDate = dateKeyToUTCDate(requestedDateKey);

    await withOptionalTransaction(async (session) => {
      const options = session ? { session } : {};

      const existingLeave = await Leave.findOne({ userId: req.user._id, date: normalizedDate }, null, options);
      if (existingLeave) {
        return existingLeave;
      }

      await Leave.create(
        [
          {
            userId: req.user._id,
            date: normalizedDate,
            note,
          },
        ],
        session ? { session } : {}
      );

      await Booking.deleteOne({ userId: req.user._id, date: normalizedDate }, options);
      return null;
    });

    broadcastAvailabilityUpdate(requestedDateKey);
    return res.json({ message: "Leave marked successfully. Any active booking for that day has been released." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Leave is already marked for this day." });
    }

    next(error);
  }
};

export const unmarkLeave = async (req, res, next) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const requestedDateKey = normalizeDateKey(date);
    const normalizedDate = dateKeyToUTCDate(requestedDateKey);

    const leave = await Leave.findOne({
      userId: req.user._id,
      date: normalizedDate,
    });

    if (!leave) {
      return res.status(404).json({ message: "No leave record found for this date." });
    }

    await leave.deleteOne();
    broadcastAvailabilityUpdate(requestedDateKey);

    return res.json({ message: "Leave removed successfully. You can book a seat again for this day." });
  } catch (error) {
    next(error);
  }
};
