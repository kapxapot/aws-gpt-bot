import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimit } from "../entities/consumption";
import { KnownWord } from "../entities/grammar";
import { ModelCode } from "../entities/model";
import { User } from "../entities/user";
import { toFixedOrIntStr } from "../lib/common";
import { settings } from "../lib/constants";
import { cleanJoin, commatize, sentence } from "../lib/text";
import { isConsumptionLimit } from "./consumptionService";
import { formatInterval, formatLimit } from "./formatService";
import { formatWordNumber, getCase, getCaseForNumber } from "./grammarService";
import { formatModelSuffix, getModelSymbol, getModelWord } from "./modelService";

export function formatRemainingLimits(
  user: User,
  limits: ConsumptionLimits,
  modelCode: ModelCode,
  usagePoints?: number,
  targetWord?: KnownWord
): string {
  const word = getModelWord(modelCode);

  if (isConsumptionLimit(limits)) {
    return sentence(
      `${formatLeft(modelCode)}: ${formatRemainingLimit(limits)}`,
      formatTargetLimit(limits, targetWord ?? word, usagePoints)
    );
  }

  const formattedIntervalLimits = limits.map(limit =>
    sentence(
      `${formatInterval(user, limit.interval)}: ${formatRemainingLimit(limit)}`,
      formatTargetLimit(limit, targetWord ?? word, usagePoints)
    )
  );

  return sentence(
    formatLeft(modelCode),
    commatize(formattedIntervalLimits)
  );
}

export function formatConsumptionLimits(
  user: User,
  limits: ConsumptionLimits,
  modelCode: ModelCode,
  showConsumption: boolean
): string[] {
  const formattedLimits = [];

  if (isConsumptionLimit(limits)) {
    const formattedLimit = formatConsumptionLimit(
      limits,
      modelCode,
      showConsumption
    );

    formattedLimits.push(formattedLimit);
  } else {
    for (const limit of limits) {
      const formattedLimit = formatIntervalConsumptionLimit(
        user,
        limit,
        modelCode,
        showConsumption
      );

      formattedLimits.push(formattedLimit);
    }
  }

  return formattedLimits;
}

function formatConsumptionLimit(
  limit: ConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
): string {
  showConsumption = showConsumption && (limit.consumed > 0);

  const word = getModelWord(modelCode);
  const limitNumber = showConsumption ? limit.remaining : limit.limit;

  return sentence(
    getModelSymbol(modelCode),
    formatRemainingLimit(limit, showConsumption),
    getCaseForNumber(word, limitNumber),
    formatModelSuffix(modelCode)
  );
}

const formatIntervalConsumptionLimit = (
  user: User,
  limit: IntervalConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
) => sentence(
  formatConsumptionLimit(limit, modelCode, showConsumption),
  formatInterval(user, limit.interval)
);

function formatLeft(modelCode: ModelCode): string {
  const word = getModelWord(modelCode);

  return sentence(
    "осталось",
    getModelSymbol(modelCode),
    getCase(word, "Genitive", "Plural")
  );
}

function formatRemainingLimit(
  { remaining, limit }: ConsumptionLimit,
  showConsumption: boolean = true
) {
  return cleanJoin([
    showConsumption ? toFixedOrIntStr(remaining, 1) : null,
    formatLimit(limit)
  ], "/");
}

/**
 * Formats a limit for a target model / word.
 */
function formatTargetLimit(
  limit: ConsumptionLimit,
  targetWord: KnownWord,
  usagePoints?: number
): string | null {
  if (!usagePoints || usagePoints <= 0 || usagePoints === settings.defaultUsagePoints) {
    return null;
  }

  const remainingCount = Math.floor(limit.remaining / usagePoints);

  return `= ${formatWordNumber(targetWord, remainingCount)}`;
}
