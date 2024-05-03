import { ts } from "../entities/at";
import { ModelCode } from "../entities/model";
import { PlanSettings } from "../entities/planSettings";
import { Product, ProductCode, PurchasedProduct, bossBundle, creativeBundle, noviceBundle, premiumSubscription, proBundle, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { User } from "../entities/user";
import { capitalize, cleanJoin } from "../lib/common";
import { addDays, formatDate, isInRange } from "./dateService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { getSubscriptionFullDisplayName, getSubscriptionPlan } from "./subscriptionService";
import { getUserPurchasedProducts } from "./userService";

type TimestampRange = {
  start: number;
  end: number;
};

export function formatProductName(product: PurchasedProduct): string {
  const productName = getSubscriptionFullDisplayName(product);

  return cleanJoin([
    product.icon,
    `<b>${capitalize(productName)}</b>`,
    formatProductExpiration(product)
  ]);
}

export function getProductByCode(code: ProductCode): Product {
  const products = [
    ...gpt3Products,
    ...gptokenProducts
  ];

  const product = products.find(p => p.code === code);

  if (product) {
    return product;
  }

  throw new Error(`Product not found: ${code}`);
}

export const gpt3Products = [
  premiumSubscription,
  unlimitedSubscription,
  noviceBundle,
  studentBundle,
  testTinyGpt3Bundle
];

export const gptokenProducts = [
  trialBundle,
  creativeBundle,
  proBundle,
  bossBundle,
  testTinyGptokenBundle
];

export const isActiveProduct = (product: PurchasedProduct) =>
  !isProductExpired(product) && !isProductExhausted(product);

/**
 * Returns user's active products sorted by their purchase date descending.
 */
export const getActiveProducts = (user: User): PurchasedProduct[] =>
  getUserPurchasedProducts(user)
    .filter(product => isActiveProduct(product))
    .sort((a, b) => b.purchasedAt.timestamp - a.purchasedAt.timestamp);

export function getProductTimestampRange(product: PurchasedProduct): TimestampRange {
  const start = product.purchasedAt.timestamp;
  const end = addDays(start, product.details.term.range + 1);

  return { start, end };
}

export function getProductPlanSettings(product: PurchasedProduct): PlanSettings {
  const plan = getSubscriptionPlan(product);
  return getPlanSettings(plan);
}

export const getProductAvailableModels = (product: PurchasedProduct) =>
  getProductModels(product)
    .filter(modelCode => !isProductUsageExceeded(product, modelCode));

function formatProductExpiration(product: PurchasedProduct): string {
  const { end } = getProductTimestampRange(product);
  const expiresAt = new Date(end);

  return `(действует по ${formatDate(expiresAt, "dd.MM.yyyy")})`;
}

function isProductExpired(product: PurchasedProduct): boolean {
  const { start, end } = getProductTimestampRange(product);
  return !isInRange(ts(), start, end);
}

const isProductExhausted = (product: PurchasedProduct) =>
  getProductModels(product)
    .every(modelCode => isProductUsageExceeded(product, modelCode));

function getProductModels(product: PurchasedProduct): ModelCode[] {
  const planSettings = getProductPlanSettings(product);
  return Object.keys(planSettings.limits) as ModelCode[];
}
