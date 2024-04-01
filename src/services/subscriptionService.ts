import { ts } from "../entities/at";
import { PurchasedProduct, Subscription, freeSubscription, isPurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { addDays, formatDate, isInRange } from "./dateService";
import { getProductDisplayName } from "./productService";

type SubscriptionDisplayInfo = {
  name: string;
  expiresAt: Date | null;
};

type TimestampRange = {
  start: number;
  end: number;
};

export function formatSubscription(subscription: Subscription): string {
  const { name, expiresAt } = getSubscriptionDisplayInfo(subscription);

  if (!expiresAt) {
    return name;
  }

  return `${name} (действует по ${formatDate(expiresAt, "dd.MM.yyyy")})`;
}

function getSubscriptionDisplayInfo(subscription: Subscription): SubscriptionDisplayInfo {
  const name = `<b>${getProductDisplayName(subscription)}</b>`;

  let expiresAt = null;

  if (isPurchasedProduct(subscription)) {
    const { end } = getProductTimestampRange(subscription);
    expiresAt = new Date(end);
  }

  return { name, expiresAt };
}

export function getCurrentSubscription(user: User): Subscription {
  const activeSubscriptions = getActiveSubscriptions(user)
    .sort((a, b) => b.details.priority - a.details.priority);

  return first(activeSubscriptions) ?? freeSubscription();
}

function getActiveSubscriptions(user: User): PurchasedProduct[] {
  return getPurchasedProducts(user)
    .filter(pp => isActiveSubscription(pp));
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

function getProductTimestampRange(product: PurchasedProduct): TimestampRange {
  const start = product.purchasedAt.timestamp;
  const end = addDays(start, product.details.term.range + 1);

  return { start, end };
}

export const getSubscriptionPlan = (subscription: Subscription) => subscription.details.plan;
