import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export const getPlanSettingsModelLimit = (
  settings: PlanSettings,
  modelCode: ModelCode
) => settings.limits[modelCode] ?? null;
