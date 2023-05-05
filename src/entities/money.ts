import { Currency } from "./currency";

export interface Money {
  currency: Currency;
  amount: number;
}

export function rub(amount: number): Money {
  return {
    currency: "RUB",
    amount
  };
}
