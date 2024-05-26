import { At, happened } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings } from "../entities/planSettings";
import { ExpirableProduct, Product, ProductCode, PurchasedProduct, bossBundle, creativeBundle, isExpirableProduct, noviceBundle, premiumSubscription, proBundle, promoBundle, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { StringLike, isEmpty } from "../lib/common";
import { commands, symbols } from "../lib/constants";
import { bulletize, cleanJoin, toCompactText, toText } from "../lib/text";
import { uuid } from "../lib/uuid";
import { addDays, addTerm, formatDate } from "./dateService";
import { gptokenString } from "./gptokenService";
import { formatWordNumber } from "./grammarService";
import { formatMoney } from "./moneyService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { SubscriptionNameOptions, getPrettySubscriptionName, getSubscriptionPlan } from "./subscriptionService";
import { formatTerm } from "./termService";

export type ProductDescriptionOptions = {
  showPrice?: boolean;
  showConsumption?: boolean;
  showExpiration?: boolean;
};

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

export const getPrettyProductName = (product: Product, options?: SubscriptionNameOptions) =>
  getPrettySubscriptionName(product, options);

export function formatProductName(
  product: Product,
  targetCase?: GrammarCase
): string {
  return cleanJoin([
    `<b>${getPrettyProductName(product, { full: true, targetCase })}</b>`,
    isExpirableProduct(product)
      ? `(${formatProductExpiration(product)})`
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

export function formatProductsString(products: PurchasedProduct[]): string | null {
  if (isEmpty(products)) {
    return null;
  }

  return `${symbols.product} У вас ${formatWordNumber("продукт", products.length)}: /${commands.products}`;
}

export function formatProductDescriptions(
  products: Product[],
  options: ProductDescriptionOptions = {}
): StringLike {
  if (isEmpty(products)) {
    return null;
  }

  return toText(
    "Ваши продукты:",
    ...products
      .map(product => formatProductDescription(product, options))
  );
}

export function formatProductDescription(
  product: Product,
  options: ProductDescriptionOptions = {}
): string {
  const term = product.details.term;
  const termChunk = term ? `на ${formatTerm(term, "Accusative")}` : "";

  const priceLine = options.showPrice
    ? `${formatMoney(product.price)}${termChunk}`
    : null;

  const expirationLine = (options.showExpiration && isExpirableProduct(product))
    ? formatProductExpiration(product)
    : null;

  const plan = getProductPlan(product);
  const prettyName = getPrettyProductName(product);

  const buildDescription = (...lines: StringLike[]) =>
    toCompactText(
      `<b>${prettyName}</b>`,
      ...bulletize(...lines, priceLine, expirationLine)
    );

  const gptokenDescription = (gptokens: number) => buildDescription(
    gptokenString(gptokens)
  );

  switch (plan) {
    case "premium":
      return buildDescription(
        `до ${formatWordNumber("запрос", 100, "Genitive")} в день`
      );

    case "unlimited":
      return buildDescription(
        "неограниченное количество запросов"
      );

    case "novice":
      return buildDescription(
        formatWordNumber("запрос", 200)
      );

    case "student":
      return buildDescription(
        formatWordNumber("запрос", 500)
      );

    case "promo":
      return gptokenDescription(10);

    case "trial":
      return gptokenDescription(20);

    case "creative":
      return gptokenDescription(50);

    case "pro":
      return gptokenDescription(150);

    case "boss":
      return gptokenDescription(400);

    case "test-tinygpt3":
      return buildDescription(
        formatWordNumber("запрос", 2)
      );

    case "test-tinygptokens":
      return gptokenDescription(4);
  }

  return prettyName;
}

const formatProductExpiration = (product: ExpirableProduct) =>
  `действует по ${getProductExpiration(product)}`;

function getProductExpiration(product: ExpirableProduct): string {
  const end = getProductEnd(product);
  const expiresAt = new Date(end);

  return formatDate(expiresAt, "dd.MM.yyyy");
}

function isProductExpired(product: PurchasedProduct): boolean {
  return isExpirableProduct(product)
    ? !happened(getProductEnd(product))
    : false;
}

function getProductEnd(product: ExpirableProduct): number {
  const start = product.purchasedAt.timestamp;
  const term = product.details.term;
  const endOfTerm = addTerm(start, term);
  const end = addDays(endOfTerm, 1);

  return end;
}

const isProductExhausted = (product: PurchasedProduct) =>
  getProductModels(product)
    .every(modelCode => isProductUsageExceeded(product, modelCode));

function getProductModels(product: PurchasedProduct): ModelCode[] {
  const planSettings = getProductPlanSettings(product);
  return Object.keys(planSettings.limits) as ModelCode[];
}
