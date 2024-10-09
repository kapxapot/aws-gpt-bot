import { Currency } from "../entities/currency";
import { GrammarCase } from "../entities/grammar";
import { Interval } from "../entities/interval";
import { Money } from "../entities/money";
import { Term } from "../entities/term";
import { User } from "../entities/user";
import { sentence } from "../lib/text";
import { EnWord, t, tWordNumber } from "../lib/translate";

const currencyToWord: Record<Currency, EnWord> = {
  "RUB": "ruble",
  "USD": "dollar",
  "EUR": "euro",
  "XTR": "star"
};

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

  return sentence(
    getCurrencySymbol(money.currency),
    tWordNumber(user, word, money.amount, targetCase)
  );
}

function getCurrencySymbol(currency: Currency) {
  return currency === "XTR" ? "⭐️" : null;
}
