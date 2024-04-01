import { GrammarCase } from "../entities/grammar";
import { Product, ProductCode, Subscription, monthlyCreativeBundle, monthlyPremiumSubscription, monthlyProBundle, monthlyStarterBundle, monthlyUnlimitedSubscription, productTypeDisplayNames } from "../entities/product";
import { getCase } from "./grammarService";

export function getProductFullDisplayName(product: Subscription, targetCase?: GrammarCase) {
  const productTypeName = getProductTypeDisplayName(product, targetCase);
  const productName = getProductDisplayName(product);

  return `${productTypeName} <b>${productName}</b>`;
}

export function getProductTypeDisplayName(product: Subscription, targetCase: GrammarCase = "Nominative") {
  const displayName = productTypeDisplayNames[product.details.type];
  return getCase(displayName, targetCase);
}

export function getProductDisplayName(product: Subscription, targetCase: GrammarCase = "Nominative") {
  return product.displayNames[targetCase]
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
