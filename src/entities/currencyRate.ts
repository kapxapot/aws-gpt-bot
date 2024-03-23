import { Entity } from "../lib/types";
import { At } from "./at";
import { Currency } from "./currency";

export type CurrencyRate = Entity & {
  from: Currency;
  to: Currency;
  rate: number;
  at: At;
};
