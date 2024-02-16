import { Entity } from "../lib/types";
import { At } from "./at";
import { Money } from "./money";
import { Product } from "./product";

export type PaymentType = "YooMoney";

export type PaymentEvent = {
  type: "created" | "succeeded"
  details: unknown;
  at: At;
};

export type Payment = Entity & {
  userId: string;
  type: PaymentType;
  cart: Product[];
  total: Money;
  description: string;
  status: string;
  url: string;
  requestData: unknown;
  responseData: unknown;
  events: PaymentEvent[];
};
