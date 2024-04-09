import { At, at, now } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { PureModelCode } from "../entities/model";
import { UserModelUsage } from "../entities/modelUsage";
import { Plan } from "../entities/plan";
import { UsageStats, User } from "../entities/user";
import { commatize, isNumber } from "../lib/common";
import { updateUser } from "../storage/userStorage";
import { startOf } from "./dateService";
import { getIntervalString } from "./intervalService";
import { buildIntervalUsages, getIntervalUsage, incIntervalUsage } from "./intervalUsageService";
import { getPlanSettings, getPlanSettingsLimit, getPlanSettingsModelLimit } from "./planSettingsService";
import { formatLimit } from "./usageLimitService";
import { getUserPlanSettings } from "./userService";

export function getLastUsedAt(usageStats: UsageStats | undefined, modelCode: PureModelCode): At | null {
  if (!usageStats) {
    return null;
  }

  const modelUsage = getModelUsage(usageStats, modelCode);

  if (modelUsage) {
    return modelUsage.lastUsedAt;
  }

  // backfill for gpt-3
  if (modelCode === "gpt3" && usageStats.lastMessageAt) {
    return usageStats.lastMessageAt;
  }

  return null;
}

export function getUsageCount(
  usageStats: UsageStats | undefined,
  modelCode: PureModelCode,
  interval: Interval
): number {
  if (!usageStats) {
    return 0;
  }

  const then = now();
  const modelUsage = getModelUsage(usageStats, modelCode);

  if (modelUsage) {
    const intervalUsage = getIntervalUsage(modelUsage, interval);

    if (intervalUsage && intervalUsage.startedAt.timestamp === startOf(interval, then)) {
      return intervalUsage.count;
    }
  }

  // backfill for gpt-3
  if (modelCode === "gpt3"
    && usageStats.messageCount
    && usageStats.startOfDay === startOf("day", then)
  ) {
    return usageStats.messageCount;
  }

  return 0;
}

export async function incUsage(user: User, modelCode: PureModelCode, usedAt: At): Promise<User> {
  const usageStats = user.usageStats ?? {};
  let modelUsage = getModelUsage(usageStats, modelCode);
  const then = now();

  if (modelUsage) {
    // update interval usages
    for (const interval of intervals) {
      modelUsage = incIntervalUsage(modelUsage, interval, then);
    }
  } else {
    // build fresh model usage
    modelUsage = buildModelUsage(usedAt, then);

    // backfill for gpt-3
    if (modelCode === "gpt3") {
      const startOfDay = startOf("day", then);

      if (usageStats.messageCount && usageStats.startOfDay === startOfDay) {
        modelUsage.intervalUsages["day"] = {
          startedAt: at(startOfDay),
          count: usageStats.messageCount + 1
        };
      }
    }
  }

  return await updateUsageStats(
    user,
    setModelUsage(usageStats, modelCode, modelUsage)
  );
}

export function isUsageLimitExceeded(
  user: User,
  modelCode: PureModelCode,
  interval: Interval
): boolean {
  const usageCount = getUsageCount(user.usageStats, modelCode, interval);
  const settings = getUserPlanSettings(user);
  const limit = getPlanSettingsLimit(settings, modelCode, interval);

  if (!limit) {
    return true; // no limit = exceeded
  }

  return usageCount >= limit;
}

export function getModelUsage(usageStats: UsageStats, modelCode: PureModelCode): UserModelUsage | null {
  return usageStats.modelUsages
    ? usageStats.modelUsages[modelCode] ?? null
    : null;
}

export function getUsageStatsReport(user: User, plan: Plan, modelCode: PureModelCode): string | null {
  const usageStats = user.usageStats;

  if (!usageStats) {
    return null;
  }

  // get all limits for the plan
  const settings = getPlanSettings(plan);
  const limit = getPlanSettingsModelLimit(settings, modelCode);

  // ignore numeric limit for now - it is not used
  if (!limit || isNumber(limit)) {
    return null;
  }

  // for every limit get usage and build string
  const chunks: string[] = [];

  for (const key in Object.keys(limit)) {
    const interval = key as Interval;
    const intervalLimit = limit[interval];

    if (!intervalLimit) {
      continue;
    }

    const usageCount = getUsageCount(usageStats, modelCode, interval);
    const limitString = formatLimit(intervalLimit);

    chunks.push(`сообщений за ${getIntervalString(interval, "Genitive")}: ${usageCount}/${limitString}`);
  }

  return commatize(chunks);
}

function setModelUsage(
  usageStats: UsageStats,
  modelCode: PureModelCode,
  modelUsage: UserModelUsage
): UsageStats {
  return {
    ...usageStats,
    modelUsages: {
      ...usageStats.modelUsages,
      [modelCode]: modelUsage
    }
  };
}

function buildModelUsage(usedAt: At, now: At): UserModelUsage {
  return {
    intervalUsages: buildIntervalUsages(now),
    lastUsedAt: usedAt
  };
}

async function updateUsageStats(user: User, usageStats: UsageStats): Promise<User> {
  return await updateUser(
    user,
    {
      usageStats
    }
  );
}
