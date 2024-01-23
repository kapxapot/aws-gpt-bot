import { format } from "date-fns";
import { settings } from "../lib/constants";
import { ts } from "../entities/at";

/**
 * One day in milliseconds.
 */
const oneDay = 1000 * 60 * 60 * 24;

export function isInRange(dot: DateOrTs, start: number, end: number): boolean {
  const ts = toTs(dot);
  return ts >= start && ts < end;
}

/**
 * Returns *system* start of the day for a given date. In case of `undefined` uses the current date.
 */
export function startOfToday(dot?: DateOrTs): number {
  const date = dot ? toDate(dot) : new Date();
  let start = addHours(utcStartOfDay(date), settings.systemTimeOffset);

  const ts = toTs(date);

  while (ts > start + oneDay) {
    start = addDays(start, 1);
  }

  return start;
}

export function utcStartOfDay(dot?: DateOrTs): Date {
  const date = dot ? toDate(dot) : new Date();

  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  const ds = `${y}-${m}-${d}`;

  return new Date(ds);
}

export function formatDate(dot: DateOrTs, formatStr: string): string {
  const adjustedTs = addHours(dot, -settings.systemTimeOffset);

  return format(adjustedTs, formatStr);
}

export function addDays(dot: DateOrTs, days: number): number {
  const date = toDate(dot);
  return date.setDate(date.getDate() + days);
}

export function addHours(dot: DateOrTs, hours: number): number {
  const date = toDate(dot);
  return date.setHours(date.getHours() + hours);
}

type DateOrTs = Date | number;

function toDate(date: DateOrTs): Date {
  return typeof date === "number"
    ? new Date(date)
    : date;
}

function toTs(date: DateOrTs): number {
  return typeof date === "number"
    ? date
    : date.getTime();
}

/**
 * @param {number} start A timestamp in the past.
 * @param {number} interval The interval to check (in milliseconds).
 * @param {number|undefined} now Optional date that is used instead of current time.
 */
export function happened(start: number, interval: number, now?: number): boolean {
  now = now ?? ts();
  return now >= start + interval;
}
