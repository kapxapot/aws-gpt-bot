import { At } from "../entities/at";
import { Model } from "../entities/model";
import { ModelUsage, UsageStats, User } from "../entities/user";
import { updateUser } from "../storage/userStorage";
import { startOfToday } from "./dateService";

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

export async function incMessageUsage(user: User, lastMessageAt: At): Promise<User> {
  const startOfDay = startOfToday();

  const messageCount = (user.usageStats?.startOfDay === startOfDay)
    ? (user.usageStats.messageCount ?? 0) + 1
    : 1;

  return await updateUsageStats(
    user,
    {
      messageCount,
      startOfDay,
      lastMessageAt
    }
  );
}
