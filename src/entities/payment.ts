import { At, Timestamps } from "./at";
import { Money } from "./money";
import { Product } from "./product";

export type PaymentType = "YooMoney";

export interface PaymentEvent {
  type: "created" | "succeeded"
  details: any;
  at: At;
}

export interface Payment extends Timestamps {
  id: string;
  userId: string;
  type: PaymentType;
  cart: Product[];
  total: Money;
  description: string;
  status: string;
  url: string;
  requestData: any;
  responseData: any;
  events: PaymentEvent[];
}
