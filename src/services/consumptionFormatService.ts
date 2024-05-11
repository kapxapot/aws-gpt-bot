import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimits } from "../entities/consumption";
import { KnownWord } from "../entities/grammar";
import { ImageModelCode, ModelCode, TextModelCode } from "../entities/model";
import { capitalize, commatize } from "../lib/common";
import { symbols } from "../lib/constants";
import { isConsumptionLimit } from "./consumptionService";
import { formatWordNumber } from "./grammarService";
import { getIntervalString } from "./intervalService";
import { formatLimit } from "./usageLimitService";

export const formatImageConsumptionLimits = (
  limits: ConsumptionLimits,
  modelCode: ImageModelCode,
  usagePoints: number
) => formatConsumptionLimits(limits, modelCode, usagePoints, "картинка");

export const formatTextConsumptionLimits = (
  limits: ConsumptionLimits,
  modelCode: TextModelCode,
  usagePoints: number
) => formatConsumptionLimits(limits, modelCode, usagePoints, "запрос");

function formatConsumptionLimits(
  limits: ConsumptionLimits,
  modelCode: ModelCode,
  usagePoints: number,
  word: KnownWord
): string {
  const gptokens = modelCode === "gptokens";
  const what = gptokens ? "гптокенов" : "запросов";

  const formattedLimits = isConsumptionLimit(limits)
    ? formatConsumptionLimit(limits, gptokens, what, usagePoints, word)
    : formatIntervalConsumptionLimits(limits, gptokens, what, usagePoints, word);

  const capLimits = capitalize(formattedLimits);

  return gptokens
    ? `${symbols.gptoken} ${capLimits}`
    : capLimits;
}

function formatConsumptionLimit(
  { limit, remaining }: ConsumptionLimit,
  gptokens: boolean,
  what: string,
  usagePoints: number,
  word: KnownWord
): string {
  let formatted = `осталось ${what}: ${remaining}/${formatLimit(limit)}`;

  if (gptokens) {
    const remainingCount = Math.floor(remaining / usagePoints);
    formatted += ` = ${formatWordNumber(word, remainingCount)}`;
  }

  return formatted;
}

function formatIntervalConsumptionLimits(
  limits: IntervalConsumptionLimits,
  gptokens: boolean,
  what: string,
  usagePoints: number,
  word: KnownWord
): string {
  const chunks: string[] = [];

  for (const { interval, limit, remaining } of limits) {
    let formatted = `в ${getIntervalString(interval, "Accusative")}: ${remaining}/${formatLimit(limit)}`;

    if (gptokens) {
      const remainingCount = Math.floor(remaining / usagePoints);
      formatted += ` = ${formatWordNumber(word, remainingCount)}`;
    }

    chunks.push(formatted);
  }

  return `осталось ${what} ${commatize(chunks)}`;
}
