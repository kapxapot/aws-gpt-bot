import { At } from "./at";
import { KnownWord } from "./grammar";
import { ProductUsage } from "./modelUsage";
import { Money } from "./money";
import { Plan, defaultPlan } from "./plan";
import { Term } from "./term";

export type ProductType = "subscription" | "bundle";

export const productTypeDisplayNames: Record<ProductType, KnownWord> = {
  "subscription": "тариф",
  "bundle": "пакет"
};

export type Subscription = {
  name: string;
  shortName?: string;
  displayName?: string;
  icon?: string;
  details: {
    type: ProductType;
    plan: Plan;
  };
};

export const productCodes = [
  // legacy
  "subscription-premium-30-days",
  "subscription-unlimited-30-days",
  "bundle-novice-30-days",
  "bundle-student-30-days",
  "test-bundle-tiny-gpt3-1-day",
  "bundle-novice-mini-30-days",
  "bundle-student-mini-30-days",
  "bundle-creative-30-days",
  "bundle-pro-30-days",
  "bundle-boss-30-days",
  "test-bundle-tiny-gptokens-1-day",
  // coupons
  "bundle-promo-30-days",
  "bundle-trial-30-days",
  // endless
  "bundle-novice-mini",
  "bundle-student-mini",
  "bundle-trial",
  "bundle-creative",
  "bundle-pro",
  "bundle-boss",
  // test
  "test-bundle-tiny-gptokens"
] as const;

export type ProductCode = typeof productCodes[number];

export type Product = Subscription & {
  code: ProductCode;
  price: Money;
  details: {
    term?: Term;
  };
};

export type PurchasedProduct = Product & {
  id: string;
  purchasedAt: At;
  usage: ProductUsage;
};

export type ExpirableProduct = PurchasedProduct & {
  details: {
    term: Term;
  }
};

export function isPurchasedProduct(product: Subscription): product is PurchasedProduct {
  return "purchasedAt" in product;
}

export function isExpirableProduct(product: Subscription): product is ExpirableProduct {
  return isPurchasedProduct(product) && !!product.details.term;
}

export const freeSubscription: Subscription = {
  name: "Free Subscription",
  displayName: "Бесплатный",
  icon: "🤑",
  details: {
    type: "subscription",
    plan: defaultPlan
  }
};
