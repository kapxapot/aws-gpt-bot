import { KnownWord } from "./grammar";

export const intervals = ["day", "week", "month"] as const;
export type Interval = typeof intervals[number];

export const intervalWords: Record<Interval, KnownWord> = {
  "day": "день",
  "week": "неделя",
  "month": "месяц"
};
