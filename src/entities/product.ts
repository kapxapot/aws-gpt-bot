import { symbols } from "../lib/constants";
import { At } from "./at";
import { KnownWord } from "./grammar";
import { ProductUsage } from "./modelUsage";
import { Money, money, overprice } from "./money";
import { Plan, defaultPlan } from "./plan";
import { Term, days } from "./term";

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
  "subscription-premium-30-days",
  "subscription-unlimited-30-days",
  "bundle-novice-30-days",
  "bundle-student-30-days",
  "bundle-novice-mini-30-days",
  "bundle-student-mini-30-days",
  "bundle-promo-30-days",
  "bundle-trial-30-days",
  "bundle-creative-30-days",
  "bundle-pro-30-days",
  "bundle-boss-30-days",
  "test-bundle-tiny-gpt3-1-day",
  "test-bundle-tiny-gptokens-1-day"
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

export const premiumSubscription: Product = {
  code: "subscription-premium-30-days",
  name: "Premium Subscription - 30 Days",
  shortName: "Премиум",
  displayName: "Премиум на 30 дней",
  icon: "💔",
  price: money(290),
  details: {
    type: "subscription",
    plan: "premium",
    term: days(30)
  }
};

export const unlimitedSubscription: Product = {
  code: "subscription-unlimited-30-days",
  name: "Unlimited Subscription - 30 Days",
  shortName: "Безлимит",
  displayName: "Безлимит на 30 дней",
  icon: "💔",
  price: money(390),
  details: {
    type: "subscription",
    plan: "unlimited",
    term: days(30)
  }
};

export const noviceBundle: Product = {
  code: "bundle-novice-30-days",
  name: "Novice Bundle - 30 Days",
  shortName: "Новичок",
  displayName: "Новичок на 30 дней",
  icon: "👧",
  price: money(49),
  details: {
    type: "bundle",
    plan: "novice",
    term: days(30)
  }
};

export const studentBundle: Product = {
  code: "bundle-student-30-days",
  name: "Student Bundle - 30 Days",
  shortName: "Студент",
  displayName: "Студент на 30 дней",
  icon: "👨‍🎓",
  price: money(99),
  details: {
    type: "bundle",
    plan: "student",
    term: days(30)
  }
};

export const noviceMiniBundle: Product = {
  code: "bundle-novice-mini-30-days",
  name: "Novice Mini Bundle - 30 Days",
  shortName: "Новичок Мини",
  displayName: "Новичок Мини на 30 дней",
  icon: "👧",
  price: money(19),
  details: {
    type: "bundle",
    plan: "novice-mini",
    term: days(30)
  }
};

export const studentMiniBundle: Product = {
  code: "bundle-student-mini-30-days",
  name: "Student Mini Bundle - 30 Days",
  shortName: "Студент Мини",
  displayName: "Студент Мини на 30 дней",
  icon: "👨‍🎓",
  price: money(39),
  details: {
    type: "bundle",
    plan: "student-mini",
    term: days(30)
  }
};

export const promoBundle: Product = {
  code: "bundle-promo-30-days",
  name: "Promo Bundle - 30 Days",
  shortName: "Промо",
  displayName: "Промо на 30 дней",
  icon: symbols.coupon,
  price: overprice,
  details: {
    type: "bundle",
    plan: "promo",
    term: days(30)
  }
};

export const trialBundle: Product = {
  code: "bundle-trial-30-days",
  name: "Trial Bundle - 30 Days",
  shortName: "Пробный",
  displayName: "Пробный на 30 дней",
  icon: "🧪",
  price: money(99),
  details: {
    type: "bundle",
    plan: "trial",
    term: days(30)
  }
};

export const creativeBundle: Product = {
  code: "bundle-creative-30-days",
  name: "Creative Bundle - 30 Days",
  shortName: "Творческий",
  displayName: "Творческий на 30 дней",
  icon: "👩‍🎨",
  price: money(199),
  details: {
    type: "bundle",
    plan: "creative",
    term: days(30)
  }
};

export const proBundle: Product = {
  code: "bundle-pro-30-days",
  name: "Pro Bundle - 30 Days",
  shortName: "Профи",
  displayName: "Профи на 30 дней",
  icon: "😎",
  price: money(449),
  details: {
    type: "bundle",
    plan: "pro",
    term: days(30)
  }
};

export const bossBundle: Product = {
  code: "bundle-boss-30-days",
  name: "Boss Bundle - 30 Days",
  shortName: "Босс",
  displayName: "Босс на 30 дней",
  icon: "🤴",
  price: money(999),
  details: {
    type: "bundle",
    plan: "boss",
    term: days(30)
  }
};

/**
 * FOR TEST PURPOSES ONLY!
 */
export const testTinyGpt3Bundle: Product = {
  code: "test-bundle-tiny-gpt3-1-day",
  name: "Test Tiny Bundle GPT-3 - 1 Day",
  shortName: "Мелкий GPT-3",
  displayName: "Мелкий GPT-3 на 1 день",
  icon: "🛠",
  price: overprice,
  details: {
    type: "bundle",
    plan: "test-tinygpt3",
    term: days(1)
  }
};

/**
 * FOR TEST PURPOSES ONLY!
 */
export const testTinyGptokenBundle: Product = {
  code: "test-bundle-tiny-gptokens-1-day",
  name: "Test Tiny Bundle Gptoken - 1 Day",
  shortName: "Мелкий Гптокен",
  displayName: "Мелкий Гптокен на 1 день",
  icon: "🛠",
  price: overprice,
  details: {
    type: "bundle",
    plan: "test-tinygptokens",
    term: days(1)
  }
};
