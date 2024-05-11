import { Interval } from "./interval";

export type Term = {
  length: number;
  interval: Interval;
};

export const term = (length: number, interval: Interval): Term => ({ length, interval });

export const days1 = term(1, "day");
export const days30 = term(30, "day");
