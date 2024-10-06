import { GrammarCase } from "../entities/grammar";
import { Subscription, freeSubscription } from "../entities/product";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { bulletize, capitalize, compactText, sentence } from "../lib/text";
import { t, tCase } from "../lib/translate";
import { formatConsumptionLimits } from "./consumptionFormatService";
import { getUserConsumptionLimits } from "./consumptionService";
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
 * `icon typeName "displayName"`
 */
export function getPrettySubscriptionName(
  user: User,
  subscription: Subscription,
  options: SubscriptionNameOptions = {}
) {
  const { full, targetCase } = options;

  const typeCase = tCase(user, subscription.details.type, targetCase);

  const displayName = full
    ? getSubscriptionDisplayName(subscription)
    : getSubscriptionShortName(subscription);
  
  return sentence(
    subscription.icon,
    capitalize(typeCase),
    t(user, "quote", {
      content: displayName
    })
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
    `<b>${getPrettySubscriptionName(user, subscription)}</b>`,
    ...bulletize(...formattedLimits)
  );
}

const getSubscriptionShortName = (subscription: Subscription) =>
  subscription.shortName ?? getSubscriptionDisplayName(subscription);

const getSubscriptionDisplayName = (subscription: Subscription) =>
  subscription.displayName ?? subscription.name;
