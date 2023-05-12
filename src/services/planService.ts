import { At } from "../entities/at";
import { Product, getProductDisplayName } from "../entities/product";
import { User } from "../entities/user";
import { settings } from "../lib/constants";
import { updateUsageStats } from "./userService";

export async function messageLimitExceeded(user: User): Promise<boolean> {
  if (!user.usageStats) {
    return false;
  }

  const stats = user.usageStats;
  const startOfDay = startOfToday();

  if (stats.startOfDay === startOfDay) {
    return stats.messageCount >= getMessageLimit(user);
  }

  return false;
}

export async function incMessageUsage(user: User, requestedAt: At): Promise<User> {
  const startOfDay = startOfToday();

  const messageCount = (user.usageStats?.startOfDay === startOfDay)
    ? user.usageStats.messageCount + 1
    : 1;

  user.usageStats = {
    messageCount,
    startOfDay,
    lastMessageAt: requestedAt
  };

  return await updateUsageStats(user, user.usageStats);
}

function getMessageLimit(user: User): number {
  const subscription = getActiveSubscription(user);

  if (subscription) {
    return Number.POSITIVE_INFINITY;
  }

  return 10;
}

export function getActiveSubscription(user: User): Product | null {
  if (!user.events) {
    return null;
  }

  const purchaseEvent = user.events.find(e => e.type === "purchase");

  if (!purchaseEvent) {
    return null;
  }

  const product = purchaseEvent.details;

  if (product.details.type !== "subscription") {
    return null;
  }

  // check that the product is not expired
  // ..

  return product;
}

export function getCurrentPlanName(user: User) {
  const subscription = getActiveSubscription(user);

  return subscription
    ? getProductDisplayName(subscription)
    : settings.defaultPlanName;
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
  return new Date(now.toLocaleString("en-US", { timeZone: settings.systemTimeZone }));
}
