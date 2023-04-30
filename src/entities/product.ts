import { now } from "./at";
import { Money, rub } from "./money";

export interface Product {
  code: string;
  name: string;
  displayName: string;
  displayNameAccusative: string;
  price: Money;
  details: Record<string, any>;
}

export function monthlyPremiumSubscription(): Product {
  return {
    code: "subscription-premium-monthly",
    name: "Premium Subscription - 1 Month",
    displayName: "Премиум-подписка на 1 месяц",
    displayNameAccusative: "Премиум-подписку на 1 месяц",
    price: rub(290),
    details: {
      type: "subscription",
      plan: "premium",
      term: "month",
      orderedAt: now()
    }
  };
}
