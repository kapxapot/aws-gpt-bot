import { Plan } from "../entities/plan";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return planSettings.active;
}
