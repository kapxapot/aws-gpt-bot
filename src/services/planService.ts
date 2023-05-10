import { User } from "../entities/user";
import { updateUsageStats } from "./userService";

const systemTimeZone = "Europe/Moscow";

export async function messageLimitExceeded(user: User): Promise<boolean> {
  if (!user.usageStats) {
    return false;
  }

  const stats = user.usageStats;
  const startOfDay = startOfToday();

  if (stats.startOfDay === startOfDay) {
    return stats.messageCount < getMessageLimit(user);
  }

  return false;
}

export async function incMessageUsage(user: User): Promise<User> {
  const startOfDay = startOfToday();

  const messageCount = (user.usageStats?.startOfDay === startOfDay)
    ? user.usageStats.messageCount + 1
    : 1;

  user.usageStats = {
    messageCount,
    startOfDay
  };

  return await updateUsageStats(user, user.usageStats);
}

function getMessageLimit(user: User): number {
  return 10;
}

function isToday(ts: number): boolean {
  return ts >= startOfToday() && ts < startOfTomorrow();
}

function startOfToday(): number {
  return currentSystemDate().setHours(0, 0, 0, 0);
}

function startOfTomorrow(): number {
  const date = new Date(startOfToday());
  return date.setDate(date.getDate() + 1);
}

function currentSystemDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: systemTimeZone }));
}
