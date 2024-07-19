import { At, now } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { UserModelUsage } from "../entities/modelUsage";
import { UsageStats, User } from "../entities/user";
import { updateUser } from "../storage/userStorage";
import { startOf } from "./dateService";
import { buildIntervalUsages, getIntervalUsage, incIntervalUsage } from "./intervalUsageService";

export function getLastUsedAt(usageStats: UsageStats | undefined, modelCode: ModelCode): At | null {
  if (!usageStats) {
    return null;
  }

  const modelUsage = getModelUsage(usageStats, modelCode);

  return modelUsage?.lastUsedAt ?? null;
}

export function getUsageCount(
  usageStats: UsageStats | undefined,
  modelCode: ModelCode,
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

  return 0;
}

export async function incUsage(user: User, modelCode: ModelCode, usedAt: At): Promise<User> {
  const usageStats = user.usageStats ?? {};
  let modelUsage = getModelUsage(usageStats, modelCode);
  const then = now();

  if (modelUsage) {
    // update interval usages
    for (const interval of intervals) {
      modelUsage = incIntervalUsage(modelUsage, interval, then);
    }

    modelUsage.lastUsedAt = then;
  } else {
    // build fresh model usage
    modelUsage = buildModelUsage(usedAt, then);
  }

  return await updateUsageStats(
    user,
    setModelUsage(usageStats, modelCode, modelUsage)
  );
}

export function getModelUsage(usageStats: UsageStats, modelCode: ModelCode): UserModelUsage | null {
  return usageStats.modelUsages
    ? usageStats.modelUsages[modelCode] ?? null
    : null;
}

function setModelUsage(
  usageStats: UsageStats,
  modelCode: ModelCode,
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
