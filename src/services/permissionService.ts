import { isPurchasableProduct, ProductCode } from "../entities/product";
import { User } from "../entities/user";
import { isProd } from "./envService";
import { isPlanActive } from "./planService";
import { getProductByCode, getProductPlan } from "./productService";
import { isTester } from "./userService";

export const canMakePurchases = (user: User) => isProdOrTester(user);
export const canUseGpt = (user: User) => isProdOrTester(user);
export const canGenerateImages = (user: User) => isProdOrTester(user);

export function canPurchaseProduct(user: User, productCode: ProductCode) {
  if (!canMakePurchases(user)) {
    return false;
  }

  const product = getProductByCode(productCode);

  if (!isPurchasableProduct(product)) {
    return false;
  }

  const plan = getProductPlan(product);

  return isPlanActive(plan);
}

const isProdOrTester = (user: User) => isProd() || isTester(user);
