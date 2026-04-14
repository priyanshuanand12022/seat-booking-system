export const USER_ROLES = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

export const SEAT_TYPES = {
  FIXED: "fixed",
  FLOATING: "floating",
};

export const BATCHES = {
  BATCH_1: "Batch 1",
  BATCH_2: "Batch 2",
};

export const SQUADS = Array.from({ length: 10 }, (_, index) => `Squad ${index + 1}`);

export const TOTAL_SEATS = 50;
export const FIXED_SEATS = 40;
export const FLOATING_SEATS = 10;
export const BOOKING_OPEN_HOUR = 15;
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
