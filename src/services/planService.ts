import { Interval } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { ModelLimit } from "../entities/planSettings";
import { freeSubscription } from "../entities/product";
import { User } from "../entities/user";
import { bulletize, sentence, compactText, text } from "../lib/text";
import { getUserConsumptionLimits } from "./consumptionService";
import { formatWordNumber } from "./grammarService";
import { formatInterval } from "./intervalService";
import { formatModelSuffix, getModelWord } from "./modelService";
import { getPlanSettings } from "./planSettingsService";
import { getPrettySubscriptionName, getSubscriptionPlan } from "./subscriptionService";

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

export function defaultPlanDescription(user: User): string {
  const subscription = freeSubscription;
  const plan = getSubscriptionPlan(subscription);
  const modelCodes = getPlanModels(plan);

  const formattedLimits = [];

  for (const modelCode of modelCodes) {
    const modelLimit = getPlanModelLimit(plan, modelCode);
    const consumptionLimit = getUserConsumptionLimits(user, modelCode);

    formattedLimits.push(JSON.stringify({
      modelCode,
      modelLimit,
      consumptionLimit
    }));
  }

  const description = compactText(
    `<b>${getPrettySubscriptionName(subscription)}</b>`,
    ...bulletize(
      formatLimit("gpt3", 5, "day"),
      formatLimit("gpt3", 100, "month"),
      formatLimit("dalle3", 3, "week")
    )
  );

  return text(
    description,
    ...formattedLimits
  );
}

function formatLimit(modelCode: ModelCode, limit: number, interval: Interval): string {
  return sentence(
    formatWordNumber(getModelWord(modelCode), limit),
    formatModelSuffix(modelCode),
    formatInterval(interval)
  );
}
