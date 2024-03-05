import { ProductCode, getProductByCode } from "../entities/product";
import { User } from "../entities/user";
import { isProd } from "./envService";
import { isPlanActive } from "./planService";
import { getUserPlan, getUserPlanSettings, isTester } from "./userService";

export const canMakePurchases = (user: User) => isProd() || isTester(user);

/**
 * For now it's simple, but later the quotas will be taken into account too.
 */
export const canRequestImageGeneration = (user: User) => {
  const permissions = getUserPlanPermissions(user);
  return permissions.canRequestImageGeneration;
}

const getUserPlanPermissions = (user: User) => getUserPlanSettings(user).permissions;

export function canPurchaseProduct(user: User, productCode: ProductCode) {
  if (!canMakePurchases(user)) {
    return false;
  }

  const product = getProductByCode(productCode);
  const plan = product.details.plan;
  const userPlan = getUserPlan(user);

  if (userPlan === "premium" && plan === "premium") {
    return false;
  }

  if (userPlan === "unlimited") {
    return false;
  }

  return isPlanActive(plan);
}
