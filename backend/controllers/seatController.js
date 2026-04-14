import Booking from "../models/Booking.js";
import Holiday from "../models/Holiday.js";
import Leave from "../models/Leave.js";
import Seat from "../models/Seat.js";
import {
  dateKeyToUTCDate,
  getBookingOpenDateKey,
  getNextWorkingDay,
  getNowInAppZone,
  getUpcomingWorkingDates,
  isBatchDesignatedDay,
  isWeekend,
  normalizeDateKey,
  toDateKey,
} from "../utils/dateUtils.js";
import { SEAT_TYPES } from "../utils/constants.js";

const getHolidayKeySet = async () => {
  const holidays = await Holiday.find().sort({ date: 1 });
  return new Set(holidays.map((holiday) => toDateKey(holiday.date)));
};

const mapSeatAvailability = ({ seats, bookings, currentUser, targetDateKey, hasLeave }) => {
  const bookingMap = new Map(bookings.map((booking) => [booking.seatId._id.toString(), booking]));
  const userBooking = bookings.find((booking) => booking.userId._id.toString() === currentUser.id);
  const designatedDay = isBatchDesignatedDay(currentUser.batch, targetDateKey);

  const seatItems = seats.map((seat) => {
    const booking = bookingMap.get(seat._id.toString());
    const isOwnedFixedSeat = Boolean(
      seat.assignedUser && seat.assignedUser._id.toString() === currentUser.id && seat.type === SEAT_TYPES.FIXED
    );

    let canBook = !hasLeave && !booking && !userBooking;
    let reasonUnavailable = "";

    if (seat.type === SEAT_TYPES.FIXED) {
      if (!seat.assignedUser) {
        canBook = false;
        reasonUnavailable = "Fixed seat is not assigned yet.";
      } else if (seat.assignedUser._id.toString() !== currentUser.id) {
        canBook = false;
        reasonUnavailable = "This fixed seat is assigned to another employee.";
      } else if (!designatedDay) {
        canBook = false;
        reasonUnavailable = "Your fixed seat is available only on designated batch days.";
      }
    }

    if (booking) {
      canBook = false;
      reasonUnavailable =
        booking.userId._id.toString() === currentUser.id
          ? "You already booked this seat."
          : `Booked by ${booking.userId.name}.`;
    }

    if (userBooking && !booking) {
      canBook = false;
      reasonUnavailable = "You already have a booking for this day.";
    }

    if (hasLeave) {
      canBook = false;
      reasonUnavailable = "You marked leave for this day.";
    }

    return {
      id: seat.id,
      seatNumber: seat.seatNumber,
      label: seat.label,
      type: seat.type,
      assignedUser: seat.assignedUser
        ? {
            id: seat.assignedUser.id,
            name: seat.assignedUser.name,
            email: seat.assignedUser.email,
          }
        : null,
      isBooked: Boolean(booking),
      bookedBy: booking
        ? {
            id: booking.userId.id,
            name: booking.userId.name,
          }
        : null,
      bookingId: booking?.id ?? null,
      isOwnedFixedSeat,
      canBook,
      canCancel: Boolean(booking && booking.userId._id.toString() === currentUser.id),
      reasonUnavailable,
    };
  });

  return {
    userBooking: userBooking
      ? {
          id: userBooking.id,
          seatId: userBooking.seatId.id,
          seatLabel: userBooking.seatId.label,
          date: targetDateKey,
        }
      : null,
    seats: seatItems,
  };
};

export const getSeats = async (_req, res, next) => {
  try {
    const seats = await Seat.find().populate("assignedUser", "name email squad batch role").sort({ seatNumber: 1 });
    res.json({ seats });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const holidayKeys = await getHolidayKeySet();
    const now = getNowInAppZone();
    const requestedDateKey = req.query.date
      ? normalizeDateKey(req.query.date)
      : getBookingOpenDateKey(now, holidayKeys) || getNextWorkingDay(now, holidayKeys);
    const normalizedDate = dateKeyToUTCDate(requestedDateKey);

    const [seats, bookings, leave] = await Promise.all([
      Seat.find().populate("assignedUser", "name email squad batch role").sort({ seatNumber: 1 }),
      Booking.find({ date: normalizedDate }).populate("userId", "name email").populate("seatId", "label seatNumber type"),
      Leave.findOne({ userId: req.user._id, date: normalizedDate }),
    ]);

    const bookingOpenDateKey = getBookingOpenDateKey(now, holidayKeys);
    const designatedDay = isBatchDesignatedDay(req.user.batch, requestedDateKey);
    const isHoliday = holidayKeys.has(requestedDateKey);
    const weekend = isWeekend(requestedDateKey);
    const { seats: seatItems, userBooking } = mapSeatAvailability({
      seats,
      bookings,
      currentUser: req.user,
      targetDateKey: requestedDateKey,
      hasLeave: Boolean(leave),
    });

    return res.json({
      selectedDate: requestedDateKey,
      displayDate: requestedDateKey,
      bookingWindowDate: bookingOpenDateKey,
      canBookToday: bookingOpenDateKey === requestedDateKey,
      isHoliday,
      isWeekend: weekend,
      isWorkingDay: !isHoliday && !weekend,
      designatedDay,
      hasLeave: Boolean(leave),
      leave,
      userBooking,
      seats: seatItems,
      upcomingDates: getUpcomingWorkingDates(10, now.plus({ days: 1 }), holidayKeys),
    });
  } catch (error) {
    next(error);
  }
};
