import { Entity } from "../lib/types";
import { At } from "./at";
import { Money } from "./money";
import { PaymentProduct } from "./product";

export type PaymentEvent = {
  type: "created" | "succeeded"
  details?: unknown;
  at: At;
};

type PaymentBase = Entity & {
  userId: string;
  cart: PaymentProduct[];
  total: Money;
  events: PaymentEvent[];
};

export type YooMoneyPayment = PaymentBase & {
  type: "YooMoney";
  description: string;
  status: string;
  url: string;
  requestData: unknown;
  responseData: unknown;
};

export type TelegramStarsPayment = PaymentBase & {
  type: "TelegramStars";
};

export type Payment = YooMoneyPayment | TelegramStarsPayment;
