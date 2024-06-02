import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { ModelLimit } from "../entities/planSettings";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export function getPlanModels(plan: Plan): ModelCode[] {
  const planSettings = getPlanSettings(plan);
  return Object.keys(planSettings.limits) as ModelCode[];
}

export function getPlanModelLimit(plan: Plan, modelCode: ModelCode): ModelLimit | null {
  const planSettings = getPlanSettings(plan);
  return planSettings.limits[modelCode] ?? null;
}
