import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}
