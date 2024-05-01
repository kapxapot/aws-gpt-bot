import { Subscription, freeSubscription, isPurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { formatDate } from "./dateService";
import { getActiveProducts, getProductDisplayName, getProductTimestampRange } from "./productService";

type SubscriptionDisplayInfo = {
  name: string;
  expiresAt: Date | null;
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
  const activeProducts = getActiveProducts(user)
    .sort((a, b) => b.purchasedAt.timestamp - a.purchasedAt.timestamp);

  return first(activeProducts) ?? freeSubscription;
}

export const getSubscriptionPlan = (subscription: Subscription) => subscription.details.plan;
