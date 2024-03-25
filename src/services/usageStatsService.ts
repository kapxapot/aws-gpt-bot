import { At, at, now } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { Model } from "../entities/model";
import { IntervalUsage, IntervalUsages, ModelUsage, UsageStats, User } from "../entities/user";
import { updateUser } from "../storage/userStorage";
import { startOf, startOfDay, startOfMonth, startOfWeek } from "./dateService";

async function updateUsageStats(user: User, usageStats: UsageStats): Promise<User> {
  return await updateUser(
    user,
    {
      usageStats
    }
  );
}

export function getModelUsage(usageStats: UsageStats, model: Model): ModelUsage | null {
  return usageStats.modelUsages
    ? usageStats.modelUsages[model] ?? null
    : null;
}

function setModelUsage(usageStats: UsageStats, model: Model, modelUsage: ModelUsage): UsageStats {
  return {
    ...usageStats,
    modelUsages: {
      ...usageStats.modelUsages,
      [model]: modelUsage
    }
  };
}

function getIntervalUsage(modelUsage: ModelUsage, interval: Interval): IntervalUsage | null {
  return modelUsage.intervalUsages
    ? modelUsage.intervalUsages[interval] ?? null
    : null;
}

function setIntervalUsage(modelUsage: ModelUsage, interval: Interval, intervalUsage: IntervalUsage): ModelUsage {
  return {
    ...modelUsage,
    intervalUsages: {
      ...modelUsage.intervalUsages,
      [interval]: intervalUsage
    }
  };
}

export function getLastUsedAt(usageStats: UsageStats | undefined, model: Model): At | null {
  if (!usageStats) {
    return null;
  }

  const modelUsage = getModelUsage(usageStats, model);

  if (modelUsage) {
    return modelUsage.lastUsedAt;
  }

  // backfill
  if (model === "gpt-3.5-turbo-0125" && usageStats.lastMessageAt) {
    return usageStats.lastMessageAt;
  }

  return null;
}

export async function incModelUsage(user: User, model: Model, usedAt: At): Promise<User> {
  const usageStats = user.usageStats ?? {};
  let modelUsage = getModelUsage(usageStats, model);
  const then = now();

  if (modelUsage) {
    // update interval usages
    for (const interval of intervals) {
      const start = startOf(interval, then);
      let intervalUsage = getIntervalUsage(modelUsage, interval);

      if (intervalUsage && intervalUsage.startedAt.timestamp === start) {
        intervalUsage.count++;
      } else {
        intervalUsage = buildIntervalUsage(interval, then);
      }

      modelUsage = setIntervalUsage(modelUsage, interval, intervalUsage);
    }
  } else {
    // build fresh model usage
    modelUsage = buildModelUsage(usedAt, then);
  }

  return await updateUsageStats(
    user,
    setModelUsage(usageStats, model, modelUsage)
  );
}

function buildModelUsage(usedAt: At, now: At): ModelUsage {
  return {
    intervalUsages: intervals.reduce(
      (accum: IntervalUsages, val: Interval) => ({
        ...accum,
        [val]: buildIntervalUsage(val, now)
      }),
      {}
    ),
    lastUsedAt: usedAt
  };
}

function buildIntervalUsage(interval: Interval, now: At): IntervalUsage {
  return {
    startedAt: at(startOf(interval, now)),
    count: 1
  };
}