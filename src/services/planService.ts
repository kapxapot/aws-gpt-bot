import { At, ts } from "../entities/at";
import { getPlanDailyMessageLimit } from "../entities/plan";
import { PurchasedProduct, Subscription, freeSubscription, getProductDisplayName, isPurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { updateUsageStats } from "./userService";
import { addDays, formatDate, isInRange, startOfToday } from "./dateService";

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
  const subscription = getCurrentSubscription(user);
  const plan = subscription.details.plan;

  return getPlanDailyMessageLimit(plan);
}

export function getFormattedPlanName(user: User): string {
  const { name, expiresAt } = getCurrentPlan(user);
  const nameStr = `<b>${name}</b>`;

  if (!expiresAt) {
    return nameStr;
  }

  return `${nameStr} (действует по ${formatDate(expiresAt, "dd.MM.yyyy")})`;
}

export interface CurrentPlan {
  name: string;
  expiresAt: Date | null;
}

function getCurrentPlan(user: User): CurrentPlan {
  const subscription = getCurrentSubscription(user);
  const name = getProductDisplayName(subscription);

  let expiresAt = null;

  if (isPurchasedProduct(subscription)) {
    const { end } = getProductTimestampRange(subscription);
    expiresAt = new Date(end);
  }

  return { name, expiresAt };
}

export function getCurrentSubscription(user: User): PurchasedProduct | Subscription {
  const activeSubscriptions = getActiveSubscriptions(user)
    .sort((a, b) => b.details.priority - a.details.priority);

  return first(activeSubscriptions) ?? freeSubscription();
}

function getActiveSubscriptions(user: User): PurchasedProduct[] {
  return getPurchasedProducts(user).filter(pp => isActiveSubscription(pp));
}

function getPurchasedProducts(user: User): PurchasedProduct[] {
  if (!user.events) {
    return [];
  }

  return user.events
    .filter(ev => ev.type === "purchase")
    .map(ev => ({
      ...ev.details,
      purchasedAt: ev.at
    }));
}

function isActiveSubscription(product: PurchasedProduct): boolean {
  if (product.details.type !== "subscription") {
    return false;
  }

  const { start, end } = getProductTimestampRange(product);

  return isInRange(ts(), start, end);
}

interface TimestampRange {
  start: number;
  end: number;
}

function getProductTimestampRange(product: PurchasedProduct): TimestampRange {
  const start = product.purchasedAt.timestamp;
  const end = addDays(start, product.details.term.range + 1);

  return { start, end };
}
