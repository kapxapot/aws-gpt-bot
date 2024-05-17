import { GrammarCase } from "../entities/grammar";
import { Money } from "../entities/money";
import { formatWordNumber } from "./grammarService";

export function formatMoney(money: Money, targetCase?: GrammarCase): string {
  switch (money.currency) {
    case "RUB":
      return formatWordNumber("рубль", money.amount, targetCase);

    case "USD":
      return formatWordNumber("доллар", money.amount, targetCase);

    case "EUR":
      return formatWordNumber("евро", money.amount, targetCase);
  }
}
