import { GrammarCase } from "../entities/grammar";
import { Subscription, freeSubscription, productTypeDisplayNames } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { bulletize, capitalize, compactText, sentence } from "../lib/text";
import { formatConsumptionLimits } from "./consumptionFormatService";
import { getUserConsumptionLimits } from "./consumptionService";
import { getCase } from "./grammarService";
import { getPlanModels } from "./planService";
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

  return sentence(
    subscription.icon,
    capitalize(typeCase),
    `«${displayName}»`
  );
}

export function formatSubscriptionDescription(user: User, subscription: Subscription): string {
  const plan = getSubscriptionPlan(subscription);
  const modelCodes = getPlanModels(plan);

  const formattedLimits = [];

  for (const modelCode of modelCodes) {
    const limits = getUserConsumptionLimits(user, modelCode);

    if (!limits) {
      continue;
    }

    formattedLimits.push(
      ...formatConsumptionLimits(
        user,
        limits,
        modelCode,
        true
      )
    );
  }

  return compactText(
    `<b>${getPrettySubscriptionName(subscription)}</b>`,
    ...bulletize(...formattedLimits)
  );
}

const getSubscriptionShortName = (subscription: Subscription) =>
  subscription.shortName ?? getSubscriptionDisplayName(subscription);

const getSubscriptionDisplayName = (subscription: Subscription) =>
  subscription.displayName ?? subscription.name;
