import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimit } from "../entities/consumption";
import { ModelCode } from "../entities/model";
import { User } from "../entities/user";
import { toFixedOrIntStr } from "../lib/common";
import { settings } from "../lib/constants";
import { cleanJoin, commatize, sentence } from "../lib/text";
import { EnWord, t, tCase, tCaseForNumber, tWordNumber } from "../lib/translate";
import { isConsumptionLimit } from "./consumptionService";
import { formatInterval, formatLimit } from "./formatService";
import { getModelName, getModelSymbol, getModelWord, isImageModelCode } from "./modelService";

export function formatRemainingLimits(
  user: User,
  limits: ConsumptionLimits,
  modelCode: ModelCode,
  usagePoints?: number,
  targetWord?: EnWord
): string {
  const word = getModelWord(modelCode);

  if (isConsumptionLimit(limits)) {
    return sentence(
      `${formatLeft(user, modelCode)}:`,
      formatRemainingLimit(limits),
      formatTargetLimit(user, limits, targetWord ?? word, usagePoints)
    );
  }

  const formattedIntervalLimits = limits.map(limit =>
    sentence(
      `${formatInterval(user, limit.interval)}:`,
      formatRemainingLimit(limit),
      formatTargetLimit(user, limit, targetWord ?? word, usagePoints)
    )
  );

  return sentence(
    formatLeft(user, modelCode),
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
      user,
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
  user: User,
  limit: ConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
): string {
  showConsumption = showConsumption && (limit.consumed > 0);

  const word = getModelWord(modelCode);
  const limitNumber = showConsumption ? limit.remaining : limit.limit;
  const units = tCaseForNumber(user, word, limitNumber);

  return sentence(
    getModelSymbol(modelCode),
    formatRemainingLimit(limit, showConsumption),
    formatModelUnits(user, modelCode, units)
  );
}

const formatIntervalConsumptionLimit = (
  user: User,
  limit: IntervalConsumptionLimit,
  modelCode: ModelCode,
  showConsumption: boolean
) => sentence(
  formatConsumptionLimit(user, limit, modelCode, showConsumption),
  formatInterval(user, limit.interval)
);

function formatLeft(user: User, modelCode: ModelCode): string {
  const word = getModelWord(modelCode);

  const units = sentence(
    getModelSymbol(modelCode),
    tCase(user, word, "Genitive", "Plural")
  );

  return t(user, "unitsLeft", { units });
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
  user: User,
  limit: ConsumptionLimit,
  targetWord: EnWord,
  usagePoints?: number
): string | null {
  if (!usagePoints || usagePoints <= 0 || usagePoints === settings.defaultUsagePoints) {
    return null;
  }

  const remainingCount = Math.floor(limit.remaining / usagePoints);

  return `= ${tWordNumber(user, targetWord, remainingCount)}`;
}

function formatModelUnits(user: User, modelCode: ModelCode, units: string): string {
  if (modelCode === "gptokens") {
    return t(user, "modelTemplates.units", { units });
  }

  const modelName = getModelName(modelCode);

  const template = isImageModelCode(modelCode)
    ? "modelTemplates.image"
    : "modelTemplates.text";

  return t(user, template, { units, modelName });
}
