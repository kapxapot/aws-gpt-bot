import { GrammarCase } from "../entities/grammar";
import { Subscription, freeSubscription, productTypeDisplayNames } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { getCase } from "./grammarService";
import { getActiveProducts } from "./productService";

export const getCurrentSubscription = (user: User) =>
  first(getActiveProducts(user)) ?? freeSubscription;

export const getSubscriptionPlan = (subscription: Subscription) => subscription.details.plan;

export const getSubscriptionFullDisplayName = (
  subscription: Subscription,
  targetCase?: GrammarCase
) => formatSubscriptionName(
  subscription,
  getSubscriptionDisplayName(subscription),
  targetCase
);

export const getSubscriptionShortDisplayName = (
  subscription: Subscription,
  targetCase?: GrammarCase
) => formatSubscriptionName(
  subscription,
  getSubscriptionShortName(subscription),
  targetCase
);

export const getSubscriptionShortName = (subscription: Subscription) =>
  subscription.shortName ?? getSubscriptionDisplayName(subscription);

const getSubscriptionDisplayName = (subscription: Subscription) =>
  (subscription.displayNames ? subscription.displayNames["Nominative"] : null)
    ?? subscription.displayName
    ?? subscription.name;

function formatSubscriptionName(
  subscription: Subscription,
  name: string,
  targetCase: GrammarCase = "Nominative"
) {
  const typeDisplayName = productTypeDisplayNames[subscription.details.type];
  const typeCase = getCase(typeDisplayName, targetCase);

  return `${typeCase} <b>«${name}»</b>`;
}
