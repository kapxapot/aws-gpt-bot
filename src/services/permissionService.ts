import { ProductCode } from "../entities/product";
import { User } from "../entities/user";
import { isProd } from "./envService";
import { isPlanActive } from "./planService";
import { getProductByCode } from "./productService";
import { getSubscriptionPlan } from "./subscriptionService";
import { isTester } from "./userService";

export const canMakePurchases = (user: User) => isProd() || isTester(user);

export function canPurchaseProduct(user: User, productCode: ProductCode) {
  if (!canMakePurchases(user)) {
    return false;
  }

  const product = getProductByCode(productCode);
  const plan = getSubscriptionPlan(product);

  return isPlanActive(plan);
}
