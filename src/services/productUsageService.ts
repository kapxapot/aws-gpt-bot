import { At, now } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { ProductModelUsage, ProductUsage } from "../entities/modelUsage";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { commatize, isNumber } from "../lib/common";
import { settings } from "../lib/constants";
import { startOf } from "./dateService";
import { getIntervalString } from "./intervalService";
import { buildIntervalUsages, getIntervalUsage, incIntervalUsage } from "./intervalUsageService";
import { getPlanSettingsModelLimit } from "./planSettingsService";
import { getProductPlanSettings } from "./productService";
import { formatLimit } from "./usageLimitService";

export function isProductUsageExceeded(product: PurchasedProduct, modelCode: ModelCode): boolean {
  const usage = product.usage;
  const settings = getProductPlanSettings(product);
  const limit = getPlanSettingsModelLimit(settings, modelCode);

  // no model limits defined = it's usage exceeded
  if (!limit) {
    return true;
  }

  if (isNumber(limit)) {
    const usageCount = getProductUsageCount(usage, modelCode);
    return usageCount >= limit;
  }

  const intervals = Object.keys(limit) as Interval[];

  // check if any interval usage is exceeded
  return intervals.some(interval => {
    const intervalLimit = limit[interval];

    return intervalLimit
      ? getProductIntervalUsageCount(usage, modelCode, interval) >= intervalLimit
      : true; // no limit = exceeded
  });
}

/**
 * @param {At | undefined} when For testing purposes.
 */
export function incProductUsage(
  usage: ProductUsage,
  modelCode: ModelCode,
  usagePoints: number = settings.defaultUsagePoints,
  when?: At
): ProductUsage {
  let modelUsage = getProductModelUsage(usage, modelCode);
  const then = when ?? now();

  if (!modelUsage) {
    // build fresh model usage
    modelUsage = buildProductModelUsage(then, usagePoints);
  } else {
    modelUsage.count += usagePoints;

    // update interval usages
    for (const interval of intervals) {
      modelUsage = incIntervalUsage(modelUsage, interval, then, usagePoints);
    }
  }

  return setProductModelUsage(usage, modelCode, modelUsage)
}

export function buildProductModelUsage(now: At, usagePoints: number): ProductModelUsage {
  return {
    count: usagePoints,
    intervalUsages: buildIntervalUsages(now, usagePoints)
  };
}

export function getProductUsageReport(
  user: User,
  product: PurchasedProduct,
  modelCode: ModelCode
): string | null {
  const usage = product.usage;

  // get all limits for the product's plan
  const settings = getProductPlanSettings(product);
  const limit = getPlanSettingsModelLimit(settings, modelCode);

  // ignore numeric limit for now - it is not used
  if (!limit) {
    return null;
  }

  if (isNumber(limit)) {
    return `осталось: ${getProductUsageCount(usage, modelCode)}/${limit}`;
  }

  // for every limit get usage and build string
  const chunks: string[] = [];

  for (const key in Object.keys(limit)) {
    const interval = key as Interval;
    const intervalLimit = limit[interval];

    if (!intervalLimit) {
      continue;
    }

    const usageCount = getProductIntervalUsageCount(usage, modelCode, interval);
    const limitString = formatLimit(intervalLimit);

    chunks.push(`осталось в ${getIntervalString(interval, "Accusative")}: ${usageCount}/${limitString}`);
  }

  return commatize(chunks);
}

function getProductUsageCount(usage: ProductUsage, modelCode: ModelCode): number {
  const modelUsage = getProductModelUsage(usage, modelCode);
  return modelUsage?.count ?? 0;
}

function getProductIntervalUsageCount(
  usage: ProductUsage,
  modelCode: ModelCode,
  interval: Interval
): number {
  const modelUsage = getProductModelUsage(usage, modelCode);

  if (!modelUsage) {
    return 0;
  }

  const intervalUsage = getIntervalUsage(modelUsage, interval);

  if (!intervalUsage) {
    return 0;
  }

  return intervalUsage.startedAt.timestamp === startOf(interval)
    ? intervalUsage.count
    : 0;
}

function getProductModelUsage(usage: ProductUsage, modelCode: ModelCode): ProductModelUsage | null {
  return usage[modelCode] ?? null;
}

function setProductModelUsage(usage: ProductUsage, modelCode: ModelCode, modelUsage: ProductModelUsage): ProductUsage {
  return {
    ...usage,
    [modelCode]: modelUsage
  };
}
