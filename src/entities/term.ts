import { Interval } from "./interval";

export type Term = {
  range: number;
  unit: Interval;
};

export const term = (range: number, unit: Interval): Term => ({ range, unit });
