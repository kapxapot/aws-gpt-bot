import { GrammarCase } from "../entities/grammar";
import { User } from "../entities/user";
import { sentence } from "../lib/text";
import { tWordNumber } from "../lib/translate";

export const gptokenString = (user: User, amount: number, targetCase?: GrammarCase) =>
  sentence("🍥", tWordNumber(user, "gptoken", amount, targetCase));
