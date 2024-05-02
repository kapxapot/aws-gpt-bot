import { ts } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { PlanSettings } from "../entities/planSettings";
import { Product, ProductCode, PurchasedProduct, Subscription, bossBundle, creativeBundle, noviceBundle, premiumSubscription, proBundle, productTypeDisplayNames, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { User } from "../entities/user";
import { addDays, isInRange } from "./dateService";
import { getCase } from "./grammarService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { getSubscriptionPlan } from "./subscriptionService";
import { getUserPurchasedProducts } from "./userService";

type TimestampRange = {
  start: number;
  end: number;
};

export const getProductFullDisplayName = (product: Subscription, targetCase?: GrammarCase) =>
  formatProductName(product, getProductDisplayName(product), targetCase);

export const getProductShortDisplayName = (product: Subscription, targetCase?: GrammarCase) =>
  formatProductName(product, getProductShortName(product), targetCase);

export function getProductTypeDisplayName(product: Subscription, targetCase: GrammarCase = "Nominative") {
  const displayName = productTypeDisplayNames[product.details.type];
  return getCase(displayName, targetCase);
}

export const getProductShortName = (product: Subscription) =>
  product.shortName ?? getProductDisplayName(product);

export const getProductDisplayName = (product: Subscription) =>
  (product.displayNames ? product.displayNames["Nominative"] : null)
    ?? product.displayName
    ?? product.name;

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

export const getActiveProducts = (user: User): PurchasedProduct[] =>
  getUserPurchasedProducts(user)
    .filter(product => isActiveProduct(product));

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

function formatProductName(product: Subscription, productName: string, targetCase?: GrammarCase) {
  const productTypeName = getProductTypeDisplayName(product, targetCase);
  return `${productTypeName} «${productName}»`;
}
