import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimit } from "../entities/consumption";
import { ModelCode } from "../entities/model";
import { toFixedOrIntStr } from "../lib/common";
import { settings } from "../lib/constants";
import { cleanJoin, commatize, sentence } from "../lib/text";
import { isConsumptionLimit } from "./consumptionService";
import { formatWordNumber, getCase, getCaseForNumber } from "./grammarService";
import { formatInterval } from "./intervalService";
import { formatModelSuffix, getModelSymbol, getModelWord } from "./modelService";
import { formatLimit } from "./usageLimitService";

export function formatRemainingLimits(
  limits: ConsumptionLimits,
  modelCode: ModelCode,
  usagePoints?: number
): string {
  if (isConsumptionLimit(limits)) {
    return sentence(
      `${formatLeft(modelCode)}: ${formatRemainingLimit(limits)}`,
      formatSpecialLimit(limits, modelCode, usagePoints)
    );
  }

  const formattedLimits = limits.map(limit =>
    sentence(
      `${formatInterval(limit.interval)}: ${formatRemainingLimit(limit)}`,
      formatSpecialLimit(limit, modelCode, usagePoints)
    )
  );

  return sentence(
    formatLeft(modelCode),
    commatize(formattedLimits)
  );
}

export function formatConsumptionLimits(
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
  limit: IntervalConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
) => sentence(
  formatConsumptionLimit(limit, modelCode, showConsumption),
  formatInterval(limit.interval)
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

function formatSpecialLimit(
  limit: ConsumptionLimit,
  modelCode: ModelCode,
  usagePoints?: number
): string | null {
  if (!usagePoints || usagePoints <= 0 || usagePoints === settings.defaultUsagePoints) {
    return null;
  }

  const word = getModelWord(modelCode);
  const remainingCount = Math.floor(limit.remaining / usagePoints);
  
  return `= ${formatWordNumber(word, remainingCount)}`;
}
