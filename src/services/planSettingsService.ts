import { Interval } from "../entities/interval";
import { ImageModel, ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";
import { isNumber } from "../lib/common";
import { getDefaultImageModel, getImageModelByCode, isImageModelCode } from "./modelService";
import { getUsageLimitDisplayInfo } from "./usageLimitService";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanSettingsLimit(settings: PlanSettings, modelCode: ModelCode, interval?: Interval): number {
  const modelLimits = settings.limits[modelCode];

  if (isNumber(modelLimits)) {
    return modelLimits;
  }

  return interval && modelLimits
    ? modelLimits[interval] ?? 0
    : 0;
}

export function getPlanSettingsLimitText(planSettings: PlanSettings, modelCode: ModelCode, interval: Interval) {
  const limit = getPlanSettingsLimit(planSettings, modelCode, interval);
  const displayInfo = getUsageLimitDisplayInfo(limit, interval);

  return displayInfo.long;
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
