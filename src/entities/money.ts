import { Currency } from "./currency";

export type Money = {
  amount: number;
  currency: Currency;
};

export const money = (amount: number, currency: Currency = "RUB"): Money => ({ amount, currency });
