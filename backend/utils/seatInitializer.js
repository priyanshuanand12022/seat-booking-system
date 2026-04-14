import Seat from "../models/Seat.js";
import { FIXED_SEATS, TOTAL_SEATS, SEAT_TYPES } from "./constants.js";

export const initializeSeats = async () => {
  const existingSeats = await Seat.countDocuments();

  if (existingSeats > 0) {
    return;
  }

  const seats = Array.from({ length: TOTAL_SEATS }, (_, index) => {
    const seatNumber = index + 1;
    const type = seatNumber <= FIXED_SEATS ? SEAT_TYPES.FIXED : SEAT_TYPES.FLOATING;

    return {
      seatNumber,
      label: `S-${String(seatNumber).padStart(2, "0")}`,
      type,
      assignedUser: null,
    };
  });

  await Seat.insertMany(seats);
};
