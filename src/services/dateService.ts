import { format } from "date-fns";
import { settings } from "../lib/constants";
import { At, ts } from "../entities/at";
import { Interval } from "../entities/interval";

type DateLike = At | Date | number;

/**
 * Returns *system* start of the day for a given date. In case of `undefined` uses the current date.
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

function startOfWeek(dateLike?: DateLike): number {
  return startOfDay(dateLike);
}

function startOfMonth(dateLike?: DateLike): number {
  return startOfDay(dateLike);
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
  const adjustedTs = addHours(dateLike, -settings.systemTimeOffset);

  return format(adjustedTs, formatStr);
}

export function addDays(dateLike: DateLike, days: number): number {
  const date = toDate(dateLike);
  return date.setDate(date.getDate() + days);
}

export function addHours(dateLike: DateLike, hours: number): number {
  const date = toDate(dateLike);
  return date.setHours(date.getHours() + hours);
}

function toDate(date: DateLike): Date {
  if (date instanceof Date) {
    return date;
  }

  return typeof date === "number"
    ? new Date(date)
    : new Date(date.timestamp);
}

function toTs(date: DateLike): number {
  if (date instanceof Date) {
    return date.getTime();
  }

  return typeof date === "number"
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
