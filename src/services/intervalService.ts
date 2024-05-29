import { GrammarCase } from "../entities/grammar";
import { Interval, intervalWords } from "../entities/interval";
import { getCase } from "./grammarService";

export const getIntervalWord = (interval: Interval) => intervalWords[interval];

export function getIntervalString(
  interval: Interval,
  grammarCase?: GrammarCase
): string {
  const word = getIntervalWord(interval);
  return getCase(word, grammarCase);
}

/**
 * Formats the interval string in the `Accusative` case.
 */
export function formatInterval(interval: Interval): string {
  const word = getIntervalWord(interval);
  return `в ${getCase(word, "Accusative")}`;
}
