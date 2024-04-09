import { Interval } from "../entities/interval";
import { ImageModel, ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { ModelLimit, PlanSettings, planSettings } from "../entities/planSettings";
import { isNumber } from "../lib/common";
import { getDefaultImageModel, getImageModelByCode, isImageModelCode } from "./modelService";
import { getUsageLimitText } from "./usageLimitService";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanSettingsModelLimit(
  settings: PlanSettings,
  modelCode: ModelCode
): ModelLimit | null {
  return settings.limits[modelCode] ?? null;
}

export function getPlanSettingsLimit(settings: PlanSettings, modelCode: ModelCode, interval?: Interval): number {
  const modelLimit = getPlanSettingsModelLimit(settings, modelCode);

  if (!modelLimit) {
    return 0;
  }

  if (isNumber(modelLimit)) {
    return modelLimit;
  }

  return interval
    ? modelLimit[interval] ?? 0
    : 0;
}

export function getPlanSettingsLimitText(planSettings: PlanSettings, modelCode: ModelCode, interval: Interval) {
  const limit = getPlanSettingsLimit(planSettings, modelCode, interval);
  return getUsageLimitText(limit, interval);
}

export function getPlanSettingsImageModel(settings: PlanSettings): ImageModel {
  for (const key in settings.limits) {
    const modelCode = key as ModelCode;

    if (isImageModelCode(modelCode)) {
      return getImageModelByCode(modelCode);
    }
  }

  return getDefaultImageModel();
}
