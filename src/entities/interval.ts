export const intervals = [
  "day",
  "week",
  "month"
] as const;

export type Interval = typeof intervals[number];
