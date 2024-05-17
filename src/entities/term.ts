import { Interval } from "./interval";

export type Term = {
  range: number;
  unit: Interval;
};

const term = (range: number, unit: Interval): Term => ({ range, unit });

export const days = (range: number) => term(range, "day");
export const months = (range: number) => term(range, "month");
