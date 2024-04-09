import { GrammarCase } from "../entities/grammar";
import { Interval, intervalWords } from "../entities/interval";
import { getCase } from "./grammarService";

export const getIntervalString = (
  interval: Interval,
  grammarCase: GrammarCase = "Nominative"
) => getCase(intervalWords[interval], grammarCase);
