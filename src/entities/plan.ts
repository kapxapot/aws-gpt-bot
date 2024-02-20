import { settings } from "../lib/constants";
import { GptModel } from "../lib/gpt";

export type Plan = "free" | "premium" | "unlimited";

export type PlanSettings = {
  dailyMessageLimit: number;
  gptModel: GptModel;
};

const planSettings: Record<Plan, PlanSettings> = {
  "free": {
    dailyMessageLimit: settings.messageLimits.free,
    gptModel: "gpt-3.5-turbo"
  },
  "premium": {
    dailyMessageLimit: settings.messageLimits.premium,
    gptModel: "gpt-4"
  },
  "unlimited": {
    dailyMessageLimit: settings.messageLimits.unlimited,
    gptModel: "gpt-4"
  }
};

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanDailyMessageLimit(plan: Plan): number {
  const settings = getPlanSettings(plan);
  return settings.dailyMessageLimit;
}

export function getPlanGptModel(plan: Plan): GptModel {
  const settings = getPlanSettings(plan);
  return settings.gptModel;
}
