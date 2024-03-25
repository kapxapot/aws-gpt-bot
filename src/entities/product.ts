import { At } from "./at";
import { Case } from "./case";
import { Money } from "./money";
import { Plan } from "./plan";

export type Subscription = {
  name: string;
  displayNames: Partial<Record<Case, string>>;
  details: {
    plan: Plan;
  };
};

export type ProductCode =
  "subscription-premium-30-days";

export type Product = Subscription & {
  code: ProductCode;
  price: Money;
  details: {
    type: "subscription";
    term: {
      range: number;
      unit: "day";
    };
    priority: number;
  };
};

export type PurchasedProduct = Product & {
  purchasedAt: At;
};

export function isPurchasedProduct(product: Subscription): product is PurchasedProduct {
  return "purchasedAt" in product;
}

export function freeSubscription(): Subscription {
  return {
    name: "Free Subscription",
    displayNames: {
      "Nom": "Бесплатный"
    },
    details: {
      plan: "free"
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

export function getProductDisplayName(product: Subscription, targetCase?: Case) {
  return (targetCase ? product.displayNames[targetCase] : null)
    ?? product.displayNames["Nom"]
    ?? product.name;
}

export function getProductByCode(code: ProductCode): Product {
  switch (code) {
    case "subscription-premium-30-days":
      return monthlyPremiumSubscription();
  }
}
