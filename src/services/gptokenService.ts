import { GrammarCase } from "../entities/grammar";
import { symbols } from "../lib/constants";
import { getCaseForNumber } from "./grammarService";

export function gptokenString(amount: number, targetCase: GrammarCase = "Nominative"): string {
  const intAmount = Math.floor(amount);

  return `${symbols.gptoken} ${amount} ${getCaseForNumber("гптокен", intAmount, targetCase)}`;
}
