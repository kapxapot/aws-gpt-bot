import { At, happened } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { ModelLimit, PlanSettings } from "../entities/planSettings";
import { ExpirableProduct, Product, ProductCode, PurchasedProduct, isExpirableProduct } from "../entities/product";
import { gptokenProducts } from "../entities/products/gptokenProducts";
import { gptProducts } from "../entities/products/gptProducts";
import { legacyProducts } from "../entities/products/legacyProducts";
import { StringLike, isEmpty } from "../lib/common";
import { commands, symbols } from "../lib/constants";
import { bulletize, sentence, compactText, text, capitalize } from "../lib/text";
import { uuid } from "../lib/uuid";
import { formatConsumptionLimits } from "./consumptionFormatService";
import { getProductConsumptionLimits } from "./consumptionService";
import { addDays, addTerm, formatDate } from "./dateService";
import { formatWordNumber } from "./grammarService";
import { formatMoney } from "./moneyService";
import { getPlanModelLimit, getPlanModels } from "./planService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { SubscriptionNameOptions, getPrettySubscriptionName, getSubscriptionPlan } from "./subscriptionService";
import { formatTerm } from "./termService";

export type ProductDescriptionOptions = {
  showPrice?: boolean;
  showConsumption?: boolean;
  showExpiration?: boolean;
};

export const getPrettyProductName = (product: Product, options?: SubscriptionNameOptions) =>
  getPrettySubscriptionName(product, options);

export function formatProductName(
  product: Product,
  targetCase?: GrammarCase
): string {
  return sentence(
    `<b>${getPrettyProductName(product, { full: true, targetCase })}</b>`,
    isExpirableProduct(product)
      ? `(${formatProductExpiration(product)})`
      : null
  );
}

export function getProductByCode(code: ProductCode): Product {
  const products = [
    ...legacyProducts,
    ...gptProducts,
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

  return text(
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
    ? capitalize(
        formatProductExpiration(product)
      )
    : null;

  const formattedLimits = formatProductLimits(
    product,
    options.showConsumption ?? false
  );

  return compactText(
    `<b>${getPrettyProductName(product)}</b>`,
    ...bulletize(...formattedLimits, priceLine, expirationLine)
  );
}

function formatProductLimits(product: Product, showConsumption: boolean): string[] {
  const modelCodes = getProductModels(product);
  const formattedLimits = [];

  for (const modelCode of modelCodes) {
    const limits = getProductConsumptionLimits(product, modelCode);

    if (!limits) {
      continue;
    }

    formattedLimits.push(...formatConsumptionLimits(limits, modelCode, showConsumption));
  }

  return formattedLimits;
}

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

function getProductModels(product: Product): ModelCode[] {
  const plan = getProductPlan(product);
  return getPlanModels(plan);
}

export function getProductModelLimit(product: Product, modelCode: ModelCode): ModelLimit | null {
  const plan = getProductPlan(product);
  return getPlanModelLimit(plan, modelCode);
}
