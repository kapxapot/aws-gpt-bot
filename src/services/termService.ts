import { GrammarCase } from "../entities/grammar";
import { Term } from "../entities/term";
import { formatWordNumber } from "./grammarService";
import { getIntervalWord } from "./intervalService";

export function formatTerm(term: Term, targetCase?: GrammarCase): string {
  const word = getIntervalWord(term.unit);
  return formatWordNumber(word, term.range, targetCase);
}
