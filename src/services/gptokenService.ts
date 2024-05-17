import { GrammarCase } from "../entities/grammar";
import { symbols } from "../lib/constants";
import { formatWordNumber } from "./grammarService";

export function gptokenString(amount: number, targetCase?: GrammarCase): string {
  return `${symbols.gptoken} ${formatWordNumber("гптокен", amount, targetCase)}`;
}
