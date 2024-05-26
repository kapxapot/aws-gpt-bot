import { GrammarCase } from "../entities/grammar";
import { Subscription, freeSubscription, productTypeDisplayNames } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { capitalize, cleanJoin } from "../lib/text";
import { getCase } from "./grammarService";
import { getUserActiveProducts } from "./userService";

export type SubscriptionNameOptions = {
  full?: boolean;
  targetCase?: GrammarCase;
};

export const getCurrentSubscription = (user: User) =>
  first(getUserActiveProducts(user)) ?? freeSubscription;

export const getSubscriptionPlan = (subscription: Subscription) => subscription.details.plan;

/**
 * ${icon} ${typeName} ${name}
 */
export function getPrettySubscriptionName(
  subscription: Subscription,
  options: SubscriptionNameOptions = {}
) {
  const { full, targetCase } = options;

  const displayName = full
    ? getSubscriptionDisplayName(subscription)
    : getSubscriptionShortName(subscription);

  const typeDisplayName = productTypeDisplayNames[subscription.details.type];
  const typeCase = getCase(typeDisplayName, targetCase);

  return cleanJoin([
    subscription.icon,
    `${capitalize(typeCase)} «${displayName}»`
  ]);
}

const getSubscriptionShortName = (subscription: Subscription) =>
  subscription.shortName ?? getSubscriptionDisplayName(subscription);

const getSubscriptionDisplayName = (subscription: Subscription) =>
  (subscription.displayNames ? subscription.displayNames["Nominative"] : null)
    ?? subscription.displayName
    ?? subscription.name;
