import { gptokenSymbol } from "../lib/constants";
import { getCaseForNumber } from "./grammarService";

export function gptokenString(amount: number): string {
  const intAmount = Math.floor(amount);

  return `${gptokenSymbol} ${amount} ${getCaseForNumber("гптокен", intAmount)}`;
}
