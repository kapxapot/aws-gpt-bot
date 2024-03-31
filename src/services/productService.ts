import { GrammarCase } from "../entities/grammar";
import { Product, ProductCode, Subscription, monthlyCreativeBundle, monthlyPremiumSubscription, monthlyProBundle, monthlyStarterBundle, monthlyUnlimitedSubscription } from "../entities/product";

export function getProductDisplayName(product: Subscription, targetCase?: GrammarCase) {
  return (targetCase ? product.displayNames[targetCase] : null)
    ?? product.displayNames["Nominative"]
    ?? product.name;
}

export function getProductByCode(code: ProductCode): Product {
  switch (code) {
    case "subscription-premium-30-days":
      return monthlyPremiumSubscription();

    case "subscription-unlimited-30-days":
      return monthlyUnlimitedSubscription();

    case "bundle-starter-30-days":
      return monthlyStarterBundle();

    case "bundle-creative-30-days":
      return monthlyCreativeBundle();

    case "bundle-pro-30-days":
      return monthlyProBundle();
  }
}
