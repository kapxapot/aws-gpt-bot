import { At, now } from "./at";
import { Case } from "./case";
import { Money } from "./money";

export interface Product {
  code: "subscription-premium-30-days" | "subscription-unlimited-30-days";
  name: string;
  displayNames: Partial<Record<Case, string>>;
  price: Money;
  details: {
    type: "subscription";
    plan: "premium" | "unlimited";
    term: {
      range: number;
      unit: "day";
    };
    orderedAt: At;
  };
}

export function monthlyPremiumSubscription(): Product {
  return {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    displayNames: {
      "Nom": "Премиум-подписка на 30 дней",
      "Gen": "Премиум-подписки на 30 дней",
      "Acc": "Премиум-подписку на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 290
    },
    details: {
      type: "subscription",
      plan: "premium",
      term: {
        range: 30,
        unit: "day"
      },
      orderedAt: now()
    }
  };
}

export function monthlyUnlimitedSubscription(): Product {
  return {
    code: "subscription-unlimited-30-days",
    name: "Unlimited Subscription - 30 Days",
    displayNames: {
      "Nom": "Безлимит-подписка на 30 дней",
      "Gen": "Безлимит-подписки на 30 дней",
      "Acc": "Безлимит-подписку на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 390
    },
    details: {
      type: "subscription",
      plan: "unlimited",
      term: {
        range: 30,
        unit: "day"
      },
      orderedAt: now()
    }
  };
}

export function getProductDisplayName(product: Product, targetCase?: Case) {
  return (targetCase ? product.displayNames[targetCase] : null)
    ?? product.displayNames["Nom"]
    ?? product.name;
}
