import { symbols } from "../lib/constants";
import { getCaseForNumber } from "./grammarService";

export function gptokenString(amount: number): string {
  const intAmount = Math.floor(amount);

  return `${symbols.gptoken} ${amount} ${getCaseForNumber("гптокен", intAmount)}`;
}
