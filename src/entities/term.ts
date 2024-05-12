import { Interval } from "./interval";

export type Term = {
  range: number;
  unit: Interval;
};

export const term = (range: number, unit: Interval): Term => ({ range, unit });

export const days1 = term(1, "day");
export const days30 = term(30, "day");
