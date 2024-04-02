import { ProductCode } from "../entities/product";
import { User } from "../entities/user";
import { isProd } from "./envService";
import { isPlanActive } from "./planService";
import { getProductByCode } from "./productService";
import { getSubscriptionPlan } from "./subscriptionService";
import { getUserPlan, isTester } from "./userService";

export const canMakePurchases = (user: User) => isProd() || isTester(user);

/**
 * For now it's simple, but later the quotas will be taken into account too.
 */
export const canRequestImageGeneration = (user: User) => {
  return !!user; // just to use the user var
}

export function canPurchaseProduct(user: User, productCode: ProductCode) {
  if (!canMakePurchases(user)) {
    return false;
  }

  const product = getProductByCode(productCode);
  const plan = getSubscriptionPlan(product);
  const userPlan = getUserPlan(user);

  if (userPlan === plan) {
    return false;
  }

  return isPlanActive(plan);
}
