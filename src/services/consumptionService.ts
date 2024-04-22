import { ConsumptionReport, IntervalConsumption } from "../entities/consumption";
import { Interval } from "../entities/interval";
import { ModelCode, PureModelCode } from "../entities/model";
import { defaultPlan } from "../entities/plan";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { isNumber } from "../lib/common";
import { getPlanSettings, getPlanSettingsModelLimit } from "./planSettingsService";
import { getProductPlanSettings } from "./productService";
import { getProductIntervalUsageCount, getProductUsageCount } from "./productUsageService";
import { getUsageCount } from "./usageStatsService";

export function getConsumptionReport(
  user: User,
  product: PurchasedProduct | null,
  modelCode: ModelCode,
  pureModelCode: PureModelCode
): ConsumptionReport | null {
  return product
    ? getProductConsumptionReport(product, modelCode)
    : getUserConsumptionReport(user, pureModelCode);
}

function getProductConsumptionReport(
  product: PurchasedProduct,
  modelCode: ModelCode
): ConsumptionReport | null {
  const usage = product.usage;

  // get all limits for the product's plan
  const settings = getProductPlanSettings(product);
  const limit = getPlanSettingsModelLimit(settings, modelCode);

  // ignore numeric limit for now - it is not used
  if (!limit) {
    return null;
  }

  if (isNumber(limit)) {
    const usageCount = getProductUsageCount(usage, modelCode);

    return {
      count: usageCount,
      limit
    };
  }

  // for every limit get usage and build a string
  const report: IntervalConsumption[] = [];

  for (const key in Object.keys(limit)) {
    const interval = key as Interval;
    const intervalLimit = limit[interval];

    if (!intervalLimit) {
      continue;
    }

    const usageCount = getProductIntervalUsageCount(usage, modelCode, interval);

    report.push({
      interval,
      count: usageCount,
      limit: intervalLimit
    });
  }

  return report;
}

function getUserConsumptionReport(user: User, modelCode: PureModelCode): ConsumptionReport | null {
  const usageStats = user.usageStats;

  if (!usageStats) {
    return null;
  }

  // get all limits for the default plan
  const settings = getPlanSettings(defaultPlan);
  const limit = getPlanSettingsModelLimit(settings, modelCode);

  // ignore numeric limit for now - it is not used
  if (!limit || isNumber(limit)) {
    return null;
  }

  // for every limit get usage and build string
  const report: IntervalConsumption[] = [];

  for (const key in Object.keys(limit)) {
    const interval = key as Interval;
    const intervalLimit = limit[interval];

    if (!intervalLimit) {
      continue;
    }

    const usageCount = getUsageCount(usageStats, modelCode, interval);

    report.push({
      interval,
      count: usageCount,
      limit: intervalLimit
    });
  }

  return report;
}
