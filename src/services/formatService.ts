import { Currency } from "../entities/currency";
import { GrammarCase } from "../entities/grammar";
import { Interval } from "../entities/interval";
import { Money } from "../entities/money";
import { Term } from "../entities/term";
import { User } from "../entities/user";
import { EnWord, t, tWordNumber } from "../lib/translate";

const currencyToWord: Record<Currency, EnWord> = {
  "RUB": "ruble",
  "USD": "dollar",
  "EUR": "euro"
};

/**
 * Formats the interval string in the `Accusative` case.
 */
export const formatInterval = (user: User, interval: Interval) =>
  t(user, `per.${interval}`);

export const formatTerm = (user: User, term: Term, targetCase?: GrammarCase) =>
  tWordNumber(user, term.unit, term.range, targetCase);

export const formatLimit = (limit: number) =>
  limit === Number.POSITIVE_INFINITY
    ? "♾"
    : String(limit);

export function formatMoney(user: User, money: Money, targetCase?: GrammarCase): string {
  const word = currencyToWord[money.currency];
  return tWordNumber(user, word, money.amount, targetCase);
}
