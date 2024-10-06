import { At, happened } from "../entities/at";
import { GrammarCase } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { ModelLimit, PlanSettings } from "../entities/planSettings";
import { ExpirableProduct, Product, ProductCode, PurchasedProduct, isExpirableProduct, isPurchasableProduct } from "../entities/product";
import { gptokenProducts } from "../entities/products/gptokenProducts";
import { gptProducts } from "../entities/products/gptProducts";
import { legacyProducts } from "../entities/products/legacyProducts";
import { User } from "../entities/user";
import { formatCommand } from "../lib/commands";
import { StringLike, isEmpty } from "../lib/common";
import { commands } from "../lib/constants";
import { bulletize, sentence, compactText, text, capitalize } from "../lib/text";
import { t, tWordNumber } from "../lib/translate";
import { uuid } from "../lib/uuid";
import { formatConsumptionLimits } from "./consumptionFormatService";
import { getProductConsumptionLimits } from "./consumptionService";
import { addDays, addTerm, formatDate } from "./dateService";
import { getPlanModelLimit, getPlanModels } from "./planService";
import { getPlanSettings } from "./planSettingsService";
import { isProductUsageExceeded } from "./productUsageService";
import { SubscriptionNameOptions, getPrettySubscriptionName, getSubscriptionPlan } from "./subscriptionService";
import { formatMoney, formatTerm } from "./formatService";

export type ProductDescriptionOptions = {
  showPrice?: boolean;
  showConsumption?: boolean;
  showExpiration?: boolean;
};

export const getPrettyProductName = (
  user: User,
  product: Product,
  options?: SubscriptionNameOptions
) => getPrettySubscriptionName(user, product, options);

export function formatProductName(
  user: User,
  product: Product,
  targetCase?: GrammarCase
): string {
  return sentence(
    `<b>${getPrettyProductName(user, product, { full: true, targetCase })}</b>`,
    isExpirableProduct(product)
      ? `(${formatProductExpiration(user, product)})`
      : null
  );
}

export function getActiveProducts(): Product[] {
  return [
    ...gptProducts,
    ...gptokenProducts
  ];
}

export function getProductByCode(user: User, code: ProductCode): Product {
  const products = [
    ...legacyProducts,
    ...getActiveProducts()
  ];

  const product = products.find(p => p.code === code);

  if (product) {
    return product;
  }

  throw new Error(
    t(user, "errors.productNotFound", {
      productCode: code
    })
  );
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

export function formatProductsString(user: User, products: PurchasedProduct[]): string | null {
  if (isEmpty(products)) {
    return null;
  }

  return t(user, "userProducts", {
    products: tWordNumber(user, "product", products.length),
    productsCommand: formatCommand(commands.products)
  });
}

export function formatProductDescriptions(user: User, products: Product[]): StringLike {
  if (isEmpty(products)) {
    return null;
  }

  return text(
    t(user, "yourProducts"),
    ...products
      .map(product => formatProductDescription(
        user,
        product,
        {
          showExpiration: true,
          showConsumption: true
        }
      ))
  );
}

export function formatProductDescription(
  user: User,
  product: Product,
  options: ProductDescriptionOptions = {}
): string {
  const term = product.details.term;

  const priceLine = options.showPrice && isPurchasableProduct(product)
    ? sentence(
        formatMoney(user, product.price),
        term
          ? t(user, "forTerm", {
              term: formatTerm(user, term, "Accusative")
            })
          : null
      )
    : null;

  const expirationLine = (options.showExpiration && isExpirableProduct(product))
    ? capitalize(
        formatProductExpiration(user, product)
      )
    : null;

  const formattedLimits = formatProductLimits(
    user,
    product,
    options.showConsumption ?? false
  );

  return compactText(
    `<b>${getPrettyProductName(user, product)}</b>`,
    ...bulletize(...formattedLimits, priceLine, expirationLine)
  );
}

function formatProductLimits(user: User, product: Product, showConsumption: boolean): string[] {
  const modelCodes = getProductModels(product);
  const formattedLimits = [];

  for (const modelCode of modelCodes) {
    const limits = getProductConsumptionLimits(product, modelCode);

    if (!limits) {
      continue;
    }

    formattedLimits.push(
      ...formatConsumptionLimits(
        user,
        limits,
        modelCode,
        showConsumption
      )
    );
  }

  return formattedLimits;
}

const formatProductExpiration = (user: User, product: ExpirableProduct) =>
  t(user, "validUntil", {
    validUntil: getProductExpiration(user, product)
  });

function getProductExpiration(user: User, product: ExpirableProduct): string {
  const end = getProductEnd(product);
  const expiresAt = new Date(end);

  return formatDate(expiresAt, t(user, "dateFormat"));
}

function isProductExpired(product: PurchasedProduct): boolean {
  return isExpirableProduct(product)
    ? happened(getProductEnd(product))
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
