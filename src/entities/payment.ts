import { Entity } from "../lib/types";
import { At } from "./at";
import { Money } from "./money";
import { PaymentProduct } from "./product";

// eslint-disable-next-line @typescript-eslint/ban-types
type Status = "pending" | "preCheckout" | "succeeded" | (string & {});

export type PaymentEvent = {
  type: Status;
  details?: unknown;
  at: At;
};

type PaymentBase = Entity & {
  userId: string;
  cart: PaymentProduct[];
  status: Status;
  total: Money;
  events: PaymentEvent[];
};

export type YooMoneyPayment = PaymentBase & {
  type: "YooMoney";
  description: string;
  url: string;
  requestData: unknown;
  responseData: unknown;
};

export type TelegramStarsPayment = PaymentBase & {
  type: "TelegramStars";
};

export type Payment = YooMoneyPayment | TelegramStarsPayment;

export type PaymentType = Payment['type']
