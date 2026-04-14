import { DateTime } from "luxon";
import { APP_TIMEZONE, BATCHES, BOOKING_OPEN_HOUR } from "./constants.js";

export const getNowInAppZone = () => DateTime.now().setZone(APP_TIMEZONE);

export const toDateKey = (value) =>
  DateTime.fromJSDate(value instanceof Date ? value : new Date(value), { zone: "utc" })
    .setZone(APP_TIMEZONE)
    .toFormat("yyyy-LL-dd");

export const normalizeDateKey = (dateKey) =>
  DateTime.fromISO(dateKey, { zone: APP_TIMEZONE }).startOf("day").toFormat("yyyy-LL-dd");

export const dateKeyToUTCDate = (dateKey) =>
  DateTime.fromISO(dateKey, { zone: APP_TIMEZONE }).startOf("day").toUTC().toJSDate();

export const isWeekend = (dateKey) => {
  const weekday = DateTime.fromISO(dateKey, { zone: APP_TIMEZONE }).weekday;
  return weekday === 6 || weekday === 7;
};

export const isWorkingDay = (dateKey, holidayKeys = new Set()) =>
  !isWeekend(dateKey) && !holidayKeys.has(dateKey);

export const getNextWorkingDay = (startDateTime, holidayKeys = new Set()) => {
  let cursor = startDateTime.plus({ days: 1 }).startOf("day");

  while (!isWorkingDay(cursor.toFormat("yyyy-LL-dd"), holidayKeys)) {
    cursor = cursor.plus({ days: 1 });
  }

  return cursor.toFormat("yyyy-LL-dd");
};

export const getBookingOpenDateKey = (now = getNowInAppZone(), holidayKeys = new Set()) => {
  if (now.hour < BOOKING_OPEN_HOUR) {
    return null;
  }

  return getNextWorkingDay(now, holidayKeys);
};

export const getUpcomingWorkingDates = (count = 10, start = getNowInAppZone(), holidayKeys = new Set()) => {
  const dates = [];
  let cursor = start.startOf("day");

  while (dates.length < count) {
    const dateKey = cursor.toFormat("yyyy-LL-dd");
    if (isWorkingDay(dateKey, holidayKeys)) {
      dates.push(dateKey);
    }
    cursor = cursor.plus({ days: 1 });
  }

  return dates;
};

export const isBatchDesignatedDay = (batch, dateKey) => {
  const date = DateTime.fromISO(dateKey, { zone: APP_TIMEZONE });
  // The bi-weekly roster is modeled from ISO week parity so the pattern is deterministic year-round.
  const isWeekOne = date.weekNumber % 2 === 1;
  const weekday = date.weekday;
  const mondayToWednesday = weekday >= 1 && weekday <= 3;
  const thursdayToFriday = weekday >= 4 && weekday <= 5;

  if (batch === BATCHES.BATCH_1) {
    return isWeekOne ? mondayToWednesday : thursdayToFriday;
  }

  if (batch === BATCHES.BATCH_2) {
    return isWeekOne ? thursdayToFriday : mondayToWednesday;
  }

  return false;
};

export const isPastDateKey = (dateKey, now = getNowInAppZone()) =>
  DateTime.fromISO(dateKey, { zone: APP_TIMEZONE }).startOf("day") < now.startOf("day");
