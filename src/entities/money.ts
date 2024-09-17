import { isNumber } from "../lib/common";
import { Currency } from "./currency";

export type Money = {
  amount: number;
  currency: Currency;
};

export type MoneyLike = Money | number;

export const money = (amount: number, currency: Currency = "RUB"): Money => ({ amount, currency });
export const toMoney = (ml: MoneyLike) => isNumber(ml) ? money(ml) : ml;

export const overprice = money(999999);

export const isOverprice = (ml: MoneyLike) => moneyEquals(
  toMoney(ml),
  overprice
);

const moneyEquals = (money1: Money, money2: Money) =>
  money1.currency === money2.currency && money1.amount === money2.amount;
