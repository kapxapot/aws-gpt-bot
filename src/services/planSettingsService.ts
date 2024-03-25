import { Interval } from "../entities/interval";
import { GptModel, ImageModel, Model, defaultGptModel, defaultImageModel, isGptModel, isImageModel } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";
import { getUsageLimitDisplayInfo } from "./usageLimitService";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanSettingsLimit(settings: PlanSettings, model: Model, interval: Interval): number {
  const modelLimits = settings.limits[model];

  return modelLimits
    ? modelLimits[interval] ?? 0
    : 0;
}

export function getPlanSettingsLimitText(planSettings: PlanSettings, model: Model, interval: Interval) {
  const limit = getPlanSettingsLimit(planSettings, model, interval);
  const displayInfo = getUsageLimitDisplayInfo(limit, interval);

  return displayInfo.long;
}

export function getPlanSettingsGptModel(settings: PlanSettings): GptModel {
  for (const key in settings.limits) {
    const model = key as Model;

    if (isGptModel(model)) {
      return model;
    }
  }

  return defaultGptModel;
}

export function getPlanSettingsImageModel(settings: PlanSettings): ImageModel {
  for (const key in settings.limits) {
    const model = key as Model;

    if (isImageModel(model)) {
      return model;
    }
  }

  return defaultImageModel;
}
