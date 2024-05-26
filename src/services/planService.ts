import { Plan } from "../entities/plan";
import { bulletize, toCompactText } from "../lib/text";
import { formatWordNumber } from "./grammarService";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export const freePlanDescription =
  toCompactText(
    "🤑 <b>Тариф «Бесплатный»</b>",
    ...bulletize(
      `${formatWordNumber("запрос", 5)} в день`,
      `${formatWordNumber("запрос", 100)} в месяц`,
      `${formatWordNumber("запрос", 3)} к <b>DALL-E 3</b> в неделю`
    )
  );
