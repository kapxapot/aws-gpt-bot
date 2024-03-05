import { Plan } from "../entities/plan";
import { PlanSettings, planSettings } from "../entities/planSettings";
import { getMessageLimitDisplayInfo } from "./messageLimitService";

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanSettingsLimitText(planSettings: PlanSettings) {
  const limit = planSettings.text.dailyMessageLimit;
  const displayInfo = getMessageLimitDisplayInfo(limit);

  return displayInfo.long;
}
