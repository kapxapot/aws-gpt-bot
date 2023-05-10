import { now } from "./at";
import { Case } from "./case";
import { Money } from "./money";

export interface Product {
  code: "subscription-premium-30-days";
  name: string;
  displayNames: Partial<Record<Case, string>>;
  price: Money;
  details: Record<string, any>;
}

export function monthlyPremiumSubscription(): Product {
  return {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    displayNames: {
      "Nom": "Премиум-подписка на 30 дней",
      "Acc": "Премиум-подписку на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 290
    },
    details: {
      type: "subscription",
      plan: "premium",
      term: "month",
      orderedAt: now()
    }
  };
}

export function getProductDisplayName(product: Product, c: Case) {
  return product.displayNames[c]
    ?? product.displayNames["Nom"]
    ?? product.name;
}
