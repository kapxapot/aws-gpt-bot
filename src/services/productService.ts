import { At, TimeSpan } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings } from "../entities/planSettings";
import { Product, ProductCode, PurchasedProduct, bossBundle, creativeBundle, isPurchasedProduct, noviceBundle, premiumSubscription, proBundle, promoBundle, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { capitalize, cleanJoin } from "../lib/common";
import { uuid } from "../lib/uuid";
import { addDays, addTerm, formatDate, isExpired } from "./dateService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { getSubscriptionFullDisplayName, getSubscriptionPlan } from "./subscriptionService";

export function formatProductName(
  product: Product,
  targetCase?: GrammarCase
): string {
  const productName = getSubscriptionFullDisplayName(product, targetCase);

  return cleanJoin([
    product.icon,
    `<b>${capitalize(productName)}</b>`,
    isPurchasedProduct(product)
      ? `(действует по ${formatProductExpiration(product)})`
      : null
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
  promoBundle,
  trialBundle,
  creativeBundle,
  proBundle,
  bossBundle,
  testTinyGptokenBundle
];

export const isProductActive = (product: PurchasedProduct) =>
  !isProductExpired(product) && !isProductExhausted(product);

export function getProductPlan(product: Product): Plan {
  return getSubscriptionPlan(product);
}

export function getProductPlanSettings(product: PurchasedProduct): PlanSettings {
  const plan = getProductPlan(product);
  return getPlanSettings(plan);
}

export const getProductAvailableModels = (product: PurchasedProduct) =>
  getProductModels(product)
    .filter(modelCode => !isProductUsageExceeded(product, modelCode));

export function productToPurchasedProduct(product: Product, purchasedAt: At): PurchasedProduct {
  return {
    ...product,
    purchasedAt,
    id: uuid(),
    usage: {}
  };
}

export function getProductSpan(product: PurchasedProduct): TimeSpan {
  const start = product.purchasedAt.timestamp;
  const endOfTerm = addTerm(start, product.details.term);
  const end = addDays(endOfTerm, 1);

  return { start, end };
}

function formatProductExpiration(product: PurchasedProduct): string {
  const { end } = getProductSpan(product);
  const expiresAt = new Date(end);

  return formatDate(expiresAt, "dd.MM.yyyy");
}

function isProductExpired(product: PurchasedProduct): boolean {
  const span = getProductSpan(product);
  return isExpired(span);
}

const isProductExhausted = (product: PurchasedProduct) =>
  getProductModels(product)
    .every(modelCode => isProductUsageExceeded(product, modelCode));

function getProductModels(product: PurchasedProduct): ModelCode[] {
  const planSettings = getProductPlanSettings(product);
  return Object.keys(planSettings.limits) as ModelCode[];
}
