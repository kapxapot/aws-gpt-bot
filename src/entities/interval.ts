import { KnownWord } from "./grammar";

export const intervals = ["day", "week", "month"] as const;
export type Interval = typeof intervals[number];

type Phrases = {
  current: string,
  next: string,
  smilies: string
};

export const intervalWords: Record<Interval, KnownWord> = {
  "day": "день",
  "week": "неделя",
  "month": "месяц"
};

export const intervalPhrases: Record<Interval, Phrases> = {
  "day": { current: "сегодня", next: "до завтра", smilies: "😥" },
  "week": { current: "эту неделю", next: "следующей недели", smilies: "😥😥" },
  "month": { current: "этот месяц", next: "следующего месяца", smilies: "😥😥😥" }
};
