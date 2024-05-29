import { At, happened } from "../entities/at";
import { ConsumptionLimit, IntervalConsumptionLimit } from "../entities/consumption";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings } from "../entities/planSettings";
import { ExpirableProduct, Product, ProductCode, PurchasedProduct, bossBundle, creativeBundle, isExpirableProduct, isPurchasedProduct, noviceBundle, premiumSubscription, proBundle, promoBundle, studentBundle, testTinyGpt3Bundle, testTinyGptokenBundle, trialBundle, unlimitedSubscription } from "../entities/product";
import { StringLike, isEmpty, toFixedOrIntStr } from "../lib/common";
import { commands, symbols } from "../lib/constants";
import { bulletize, cleanJoin, toCompactText, toText } from "../lib/text";
import { uuid } from "../lib/uuid";
import { getProductConsumptionLimits, isConsumptionLimit } from "./consumptionService";
import { addDays, addTerm, formatDate } from "./dateService";
import { formatWordNumber, getCaseForNumber } from "./grammarService";
import { formatInterval } from "./intervalService";
import { formatModelSuffix, getModelSymbol, getModelWord } from "./modelService";
import { formatMoney } from "./moneyService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { SubscriptionNameOptions, getPrettySubscriptionName, getSubscriptionPlan } from "./subscriptionService";
import { formatTerm } from "./termService";
import { formatLimit } from "./usageLimitService";

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

export function formatProductDescriptions(products: Product[]): StringLike {
  if (isEmpty(products)) {
    return null;
  }

  return toText(
    "Ваши продукты:",
    ...products
      .map(product => formatProductDescription(
        product,
        {
          showExpiration: true,
          showConsumption: true
        }
      ))
  );
}

export function formatProductDescription(
  product: Product,
  options: ProductDescriptionOptions = {}
): string {
  const term = product.details.term;
  const termChunk = term ? `на ${formatTerm(term, "Accusative")}` : "";

  const priceLine = options.showPrice
    ? `${formatMoney(product.price)} ${termChunk}`
    : null;

  const expirationLine = (options.showExpiration && isExpirableProduct(product))
    ? formatProductExpiration(product)
    : null;

  const formattedLimits = formatProductLimits(
    product,
    options.showConsumption ?? false
  );

  return toCompactText(
    `<b>${getPrettyProductName(product)}</b>`,
    ...bulletize(...formattedLimits, priceLine, expirationLine)
  );
}

function formatProductLimits(product: Product, showConsumption: boolean): string[] {
  if (!isPurchasedProduct(product)) {
    return [];
  }

  const modelCodes = getProductModels(product);
  const formattedLimits = [];

  for (const modelCode of modelCodes) {
    const limits = getProductConsumptionLimits(product, modelCode);

    if (!limits) {
      continue;
    }

    if (isConsumptionLimit(limits)) {
      const formattedLimit = formatProductConsumptionLimit(
        limits,
        modelCode,
        showConsumption
      );

      formattedLimits.push(formattedLimit);
    } else {
      for (const limit of limits) {
        const formattedLimit = formatProductIntervalConsumptionLimit(
          limit,
          modelCode,
          showConsumption
        );

        formattedLimits.push(formattedLimit);
      }
    }
  }

  return formattedLimits;
}

function formatProductConsumptionLimit(
  consumptionLimit: ConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
): string {
  const { consumed, remaining, limit } = consumptionLimit;

  showConsumption = showConsumption && (consumed > 0);

  const prefix = showConsumption
    ? `${toFixedOrIntStr(remaining, 1)}/`
    : "";

  const word = getModelWord(modelCode);
  const limitNumber = showConsumption ? remaining : limit;

  return cleanJoin([
    getModelSymbol(modelCode),
    `${prefix}${formatLimit(limit)}`,
    getCaseForNumber(word, limitNumber),
    formatModelSuffix(modelCode)
  ]);
}

const formatProductIntervalConsumptionLimit = (
  limit: IntervalConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
) => cleanJoin([
  formatProductConsumptionLimit(limit, modelCode, showConsumption),
  formatInterval(limit.interval)
]);

const formatProductExpiration = (product: ExpirableProduct) =>
  `действует по 🕓 ${getProductExpiration(product)}`;

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
