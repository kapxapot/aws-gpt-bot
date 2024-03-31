import { Interval } from "../entities/interval";
import { GptModel, ImageModel, Model, defaultGptModel, defaultImageModel } from "../entities/model";
import { Plan } from "../entities/plan";
import { IntervalLike, PlanSettings, planSettings } from "../entities/planSettings";
import { gptokenGptModel, gptokenImageModel, isGptModel, isImageModel } from "./modelService";
import { getUsageLimitDisplayInfo } from "./usageLimitService";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanSettingsLimit(settings: PlanSettings, model: Model, interval: IntervalLike): number {
  if (!settings.limits) {
    return 0;
  }

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
  if (settings.gptokens) {
    return gptokenGptModel;
  }

  for (const key in settings.limits) {
    const model = key as Model;

    if (isGptModel(model)) {
      return model;
    }
  }

  return defaultGptModel;
}

export function getPlanSettingsImageModel(settings: PlanSettings): ImageModel {
  if (settings.gptokens) {
    return gptokenImageModel;
  }

  for (const key in settings.limits) {
    const model = key as Model;

    if (isImageModel(model)) {
      return model;
    }
  }

  return defaultImageModel;
}
