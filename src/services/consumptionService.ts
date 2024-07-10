import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimits } from "../entities/consumption";
import { Interval } from "../entities/interval";
import { ModelCode, PureModelCode } from "../entities/model";
import { defaultPlan } from "../entities/plan";
import { IntervalLimits } from "../entities/planSettings";
import { isPurchasedProduct, Product, PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { isEmpty, isNumber } from "../lib/common";
import { getPlanModelLimit } from "./planService";
import { getProductModelLimit } from "./productService";
import { getProductIntervalUsageCount, getProductUsageCount } from "./productUsageService";
import { getUsageCount } from "./usageStatsService";

export function isIntervalConsumptionLimits(
  limits: ConsumptionLimits
): limits is IntervalConsumptionLimits {
  return Array.isArray(limits);
}

export function isConsumptionLimit(
  limits: ConsumptionLimits
): limits is ConsumptionLimit {
  return !isIntervalConsumptionLimits(limits);
}

export function getConsumptionLimits(
  user: User,
  product: PurchasedProduct | null,
  modelCode: ModelCode,
  pureModelCode?: PureModelCode
): ConsumptionLimits | null {
  return product
    ? getProductConsumptionLimits(product, modelCode)
    : getUserConsumptionLimits(user, pureModelCode ?? modelCode);
}

export function getActiveConsumptionLimit(limits: ConsumptionLimits): ConsumptionLimit | null {
  return isIntervalConsumptionLimits(limits)
    ? getMinimalRemaining(limits)
    : limits;
}

function getMinimalRemaining(limits: IntervalConsumptionLimits): ConsumptionLimit | null {
  return limits.reduce(
    (activeLimit: ConsumptionLimit | null, limit: ConsumptionLimit) => {
      if (!activeLimit) {
        return limit;
      }

      return (activeLimit.remaining < limit.remaining)
        ? activeLimit
        : limit;
    },
    null
  );
}

export function getProductConsumptionLimits(
  product: Product,
  modelCode: ModelCode
): ConsumptionLimits | null {
  // get limits for the product
  const limit = getProductModelLimit(product, modelCode);

  // if the plan doesn't have a limit for the model
  if (!limit) {
    return null;
  }

  const usage = isPurchasedProduct(product)
    ? product.usage
    : null;

  // plain limit
  if (isNumber(limit)) {
    const usageCount = getProductUsageCount(usage, modelCode);

    return {
      limit,
      consumed: usageCount,
      remaining: Math.max(limit - usageCount, 0)
    };
  }

  // interval limits
  const intervalLimits = getIntervalConsumptionLimits(
    limit,
    interval => getProductIntervalUsageCount(usage, modelCode, interval)
  );

  return isEmpty(intervalLimits) ? null : intervalLimits;
}

export function getUserConsumptionLimits(
  user: User,
  modelCode: ModelCode
): ConsumptionLimits | null {
  // get limits for the default plan
  const plan = defaultPlan;
  const limit = getPlanModelLimit(plan, modelCode);

  // if a limit is not found - it is not defined for the model
  if (!limit) {
    return null;
  }

  if (isNumber(limit)) {
    throw new Error(`A numeric limit shouldn't be used for plan "${plan}".`);
  }

  // interval limits
  const intervalLimits = getIntervalConsumptionLimits(
    limit,
    interval => getUsageCount(user.usageStats, modelCode, interval)
  );

  return !isEmpty(intervalLimits) ? intervalLimits : null;
}

function getIntervalConsumptionLimits(
  limit: IntervalLimits,
  getUsageCount: (interval: Interval) => number
): IntervalConsumptionLimits {
  const limits: IntervalConsumptionLimits = [];

  for (const key of Object.keys(limit)) {
    const interval = key as Interval;
    const intervalLimit = limit[interval];

    // the limit for this interval is missing
    if (!intervalLimit) {
      continue;
    }

    const usageCount = getUsageCount(interval);

    limits.push({
      interval,
      limit: intervalLimit,
      consumed: usageCount,
      remaining: Math.max(intervalLimit - usageCount, 0)
    });
  }

  return limits;
}
