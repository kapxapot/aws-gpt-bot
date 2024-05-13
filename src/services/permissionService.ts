import { ProductCode } from "../entities/product";
import { User } from "../entities/user";
import { isProd } from "./envService";
import { isPlanActive } from "./planService";
import { getProductByCode } from "./productService";
import { getSubscriptionPlan } from "./subscriptionService";
import { isTester } from "./userService";

export const canMakePurchases = (user: User) => isProdOrTester(user);
export const canUseGpt = (user: User) => isProdOrTester(user);
export const canGenerateImages = (user: User) => isProdOrTester(user);

export function canPurchaseProduct(user: User, productCode: ProductCode) {
  if (!canMakePurchases(user)) {
    return false;
  }

  const product = getProductByCode(productCode);
  const plan = getSubscriptionPlan(product);

  return isPlanActive(plan);
}

const isProdOrTester = (user: User) => isProd() || isTester(user);
