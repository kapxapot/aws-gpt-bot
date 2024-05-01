import { Interval } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";
import { isNumber } from "../lib/common";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export const getPlanSettingsModelLimit = (
  settings: PlanSettings,
  modelCode: ModelCode
) => settings.limits[modelCode] ?? null;

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
