import { format } from "date-fns";
import { settings } from "../lib/constants";
import { At, ts } from "../entities/at";
import { Interval } from "../entities/interval";
import { isNumber } from "../lib/common";

type DateLike = At | Date | number;

/**
 * Returns *system* start of the day for a given date.
 * In case of `undefined` uses the current date.
 */
export function startOfDay(dateLike?: DateLike): number {
  const date = dateLike ? toDate(dateLike) : new Date();
  let start = addHours(utcStartOfDay(date), settings.systemTimeOffset);

  const ts = toTs(date);

  while (ts > addDays(start, 1)) {
    start = addDays(start, 1);
  }

  return start;
}

export function startOfWeek(dateLike?: DateLike): number {
  const start = startOfDay(dateLike);
  const utcStart = alignWithUtc(start);
  const weekday = getWeekday(utcStart);

  return addDays(start, 1 - weekday);
}

/**
 * 1 - Monday, ..., 7 - Sunday
 */
function getWeekday(dateLike: DateLike): number {
  const date = toDate(dateLike);
  const weekday = date.getDay();

  return weekday > 0 ? weekday : 7;
}

export function startOfMonth(dateLike?: DateLike): number {
  const start = startOfDay(dateLike);
  const utcStartDate = toDate(alignWithUtc(start));
  const day = utcStartDate.getDate();

  return addDays(start, 1 - day);
}

export function startOf(interval: Interval, dateLike?: DateLike): number {
  switch (interval) {
    case "day":
      return startOfDay(dateLike);

    case "week":
      return startOfWeek(dateLike);

    case "month":
      return startOfMonth(dateLike);
  }
}

export function utcStartOfDay(dateLike?: DateLike): Date {
  const date = dateLike ? toDate(dateLike) : new Date();

  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  const ds = `${y}-${m}-${d}`;

  return new Date(ds);
}

export function formatDate(dateLike: DateLike, formatStr: string): string {
  const adjustedTs = alignWithUtc(dateLike);
  return format(adjustedTs, formatStr);
}

function alignWithUtc(dateLike: DateLike): number {
  const date = toDate(addHours(dateLike, -settings.systemTimeOffset));
  return addMinutes(date, date.getTimezoneOffset());
}

export function addDays(dateLike: DateLike, days: number): number {
  const date = toDate(dateLike);
  return date.setDate(date.getDate() + days);
}

export function addHours(dateLike: DateLike, hours: number): number {
  const date = toDate(dateLike);
  return date.setHours(date.getHours() + hours);
}

export function addMinutes(dateLike: DateLike, minutes: number): number {
  const date = toDate(dateLike);
  return date.setMinutes(date.getMinutes() + minutes);
}

function toDate(date: DateLike): Date {
  if (date instanceof Date) {
    return date;
  }

  return isNumber(date)
    ? new Date(date)
    : new Date(date.timestamp);
}

function toTs(date: DateLike): number {
  if (date instanceof Date) {
    return date.getTime();
  }

  return isNumber(date)
    ? date
    : date.timestamp;
}

/**
 * Checks if the interval has passed since the start.
 *
 * @param {number} start The starting timestamp.
 * @param {number} interval The interval to check (in milliseconds).
 * @param {number|undefined} timestamp Optional date that is used instead of current time.
 */
export function happened(start: number, interval: number, timestamp?: number): boolean {
  return timeLeft(start, interval, timestamp) <= 0;
}

/**
 * Calculates time that is yet to pass from the start till the interval elapses.
 *
 * @param {number} start The starting timestamp.
 * @param {number} interval The interval to check (in milliseconds).
 * @param {number|undefined} timestamp Optional date that is used instead of current time.
 */
export function timeLeft(start: number, interval: number, timestamp?: number): number {
  const time = timestamp ?? ts();
  return start + interval - time;
}

export function isInRange(dateLike: DateLike, start: number, end: number): boolean {
  const ts = toTs(dateLike);
  return ts >= start && ts < end;
}
