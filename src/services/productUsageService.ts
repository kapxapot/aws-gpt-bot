import { At, now } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { ProductModelUsage, ProductUsage } from "../entities/modelUsage";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { isNumber } from "../lib/common";
import { startOf } from "./dateService";
import { buildIntervalUsages, getIntervalUsage, incIntervalUsage } from "./intervalUsageService";
import { getProductPlanSettings } from "./productService";
import { updateUserProduct } from "./userService";

export function isProductUsageExceeded(product: PurchasedProduct, modelCode: ModelCode): boolean {
  const usage = product.usage;
  const settings = getProductPlanSettings(product);
  const limits = settings.limits[modelCode];

  // no model limits defined = it's usage exceeded
  if (!limits) {
    return true;
  }

  if (isNumber(limits)) {
    const usageCount = getProductUsageCount(usage, modelCode);
    return usageCount >= limits;
  }

  const intervals = Object.keys(limits) as Interval[];

  // check if any interval usage is exceeded
  return intervals.some(interval => {
    const limit = limits[interval];
    
    return limit
      ? getProductIntervalUsageCount(usage, modelCode, interval) >= limit
      : true; // no limit = exceeded
  });
}

export async function incProductUsage(
  user: User,
  product: PurchasedProduct,
  modelCode: ModelCode
): Promise<User> {
  const usage = product.usage;
  let modelUsage = getProductModelUsage(usage, modelCode);
  const then = now();

  if (!modelUsage) {
    // build fresh model usage
    modelUsage = buildModelUsage(then);
  } else {
    modelUsage.count++;

    // update interval usages
    for (const interval of intervals) {
      modelUsage = incIntervalUsage(modelUsage, interval, then);
    }
  }

  product.usage = setProductModelUsage(usage, modelCode, modelUsage)

  return await updateUserProduct(user, product);
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

function buildModelUsage(now: At): ProductModelUsage {
  return {
    count: 0,
    intervalUsages: buildIntervalUsages(now)
  };
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
