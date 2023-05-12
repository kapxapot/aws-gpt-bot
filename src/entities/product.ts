import { At } from "./at";
import { Case } from "./case";
import { Money } from "./money";
import { Plan } from "./plan";

export interface Product {
  code: "subscription-premium-30-days" | "subscription-unlimited-30-days";
  name: string;
  displayNames: Partial<Record<Case, string>>;
  price: Money;
  details: {
    type: "subscription";
    plan: Plan;
    term: {
      range: number;
      unit: "day";
    };
    priority: number;
  };
}

export type Subscription = {
  name: string;
  displayNames: Partial<Record<Case, string>>;
  details: {
    plan: Plan;
  };
}

export type PurchasedProduct = Product & {
  purchasedAt: At;
}

export function isPurchasedProduct(product: PurchasedProduct | Subscription): product is PurchasedProduct {
  return "purchasedAt" in product;
}

export function freeSubscription(): Subscription {
  return {
    name: "Free Subscription",
    displayNames: {
      "Nom": "Бесплатный"
    },
    details: {
      plan: "free",
    }
  };
}

export function monthlyPremiumSubscription(): Product {
  return {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    displayNames: {
      "Nom": "Премиум на 30 дней",
      "Gen": "Премиума на 30 дней"
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
      priority: 100
    }
  };
}

export function monthlyUnlimitedSubscription(): Product {
  return {
    code: "subscription-unlimited-30-days",
    name: "Unlimited Subscription - 30 Days",
    displayNames: {
      "Nom": "Безлимит на 30 дней",
      "Gen": "Безлимита на 30 дней"
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
      priority: 200
    }
  };
}

export function getProductDisplayName(product: Product | Subscription, targetCase?: Case) {
  return (targetCase ? product.displayNames[targetCase] : null)
    ?? product.displayNames["Nom"]
    ?? product.name;
}
