import { ts } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { TextModelCode, ImageModelCode, ModelCode } from "../entities/model";
import { PlanSettings } from "../entities/planSettings";
import { Product, ProductCode, PurchasedProduct, Subscription, bossBundle, creativeBundle, noviceBundle, premiumSubscription, proBundle, productTypeDisplayNames, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { addDays, isInRange } from "./dateService";
import { getCase } from "./grammarService";
import { isTextModelCode, isImageModelCode } from "./modelService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { getSubscriptionPlan } from "./subscriptionService";

type TimestampRange = {
  start: number;
  end: number;
};

export function getProductFullDisplayName(product: Subscription, targetCase?: GrammarCase) {
  const productTypeName = getProductTypeDisplayName(product, targetCase);
  const productName = getProductDisplayName(product);

  return `${productTypeName} <b>${productName}</b>`;
}

export function getProductTypeDisplayName(product: Subscription, targetCase: GrammarCase = "Nominative") {
  const displayName = productTypeDisplayNames[product.details.type];
  return getCase(displayName, targetCase);
}

export const getProductShortName = (product: Subscription) =>
  product.shortName ?? product.name;

export const getProductDisplayName = (product: Subscription) =>
  (product.displayNames ? product.displayNames["Nominative"] : null)
    ?? product.displayName
    ?? product.name;

export function getProductByCode(code: ProductCode): Product {
  switch (code) {
    case "subscription-premium-30-days":
      return premiumSubscription();

    case "subscription-unlimited-30-days":
      return unlimitedSubscription();

    case "bundle-novice-30-days":
      return noviceBundle();

    case "bundle-student-30-days":
      return studentBundle();

    case "bundle-trial-30-days":
      return trialBundle();

    case "bundle-creative-30-days":
      return creativeBundle();

    case "bundle-pro-30-days":
      return proBundle();

    case "bundle-boss-30-days":
      return bossBundle();

    case "test-bundle-tiny-gpt3-1-day":
      return testTinyGpt3Bundle();

    case "test-bundle-tiny-gptokens-1-day":
      return testTinyGptokenBundle();
  }
}

export const isActiveProduct = (product: PurchasedProduct) =>
  !isProductExpired(product) && !isProductExhausted(product);

function isProductExpired(product: PurchasedProduct): boolean {
  const { start, end } = getProductTimestampRange(product);
  return !isInRange(ts(), start, end);
}

const isProductExhausted = (product: PurchasedProduct) =>
  getProductModels(product)
    .every(modelCode => isProductUsageExceeded(product, modelCode));

export function getProductTimestampRange(product: PurchasedProduct): TimestampRange {
  const start = product.purchasedAt.timestamp;
  const end = addDays(start, product.details.term.range + 1);

  return { start, end };
}

export function getProductPlanSettings(product: PurchasedProduct): PlanSettings {
  const plan = getSubscriptionPlan(product);
  return getPlanSettings(plan);
}

export const getAvailableTextModel = (product: PurchasedProduct) =>
  getProductTextModels(product)
    .find(modelCode => !isProductUsageExceeded(product, modelCode))
      ?? null;

export const getAvailableImageModel = (product: PurchasedProduct) =>
  getProductImageModels(product)
    .find(modelCode => !isProductUsageExceeded(product, modelCode))
      ?? null;

const getProductTextModels = (product: PurchasedProduct) =>
  getProductModels(product)
    .filter(modelCode => isTextModelCode(modelCode)) as TextModelCode[];

const getProductImageModels = (product: PurchasedProduct) =>
  getProductModels(product)
    .filter(modelCode => isImageModelCode(modelCode)) as ImageModelCode[];

function getProductModels(product: PurchasedProduct): ModelCode[] {
  const planSettings = getProductPlanSettings(product);
  return Object.keys(planSettings.limits) as ModelCode[];
}
