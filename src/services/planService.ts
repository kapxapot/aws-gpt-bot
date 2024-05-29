import { Interval } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { Plan } from "../entities/plan";
import { bulletize, cleanJoin, toCompactText } from "../lib/text";
import { formatWordNumber } from "./grammarService";
import { formatInterval } from "./intervalService";
import { formatModelSuffix, getModelWord } from "./modelService";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export const freePlanDescription =
  toCompactText(
    "🤑 <b>Тариф «Бесплатный»</b>",
    ...bulletize(
      formatLimit("gpt3", 5, "day"),
      formatLimit("gpt3", 100, "month"),
      formatLimit("dalle3", 3, "week")
    )
  );

function formatLimit(modelCode: ModelCode, limit: number, interval: Interval): string {
  return cleanJoin([
    formatWordNumber(getModelWord(modelCode), limit),
    formatModelSuffix(modelCode),
    formatInterval(interval)
  ]);
}
