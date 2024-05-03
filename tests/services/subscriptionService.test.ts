import { freeSubscription } from "../../src/entities/product";
import { getProductByCode } from "../../src/services/productService";
import { getSubscriptionFullDisplayName } from "../../src/services/subscriptionService";

describe("getSubscriptionFullDisplayName", () => {
  test("should correctly build name", () => {
    expect([
      getSubscriptionFullDisplayName(freeSubscription, "Genitive"),
      getSubscriptionFullDisplayName(getProductByCode("subscription-premium-30-days"), "Dative"),
      getSubscriptionFullDisplayName(getProductByCode("bundle-pro-30-days"), "Instrumental"),
    ]).toEqual([
      "тарифа <b>«Бесплатный»</b>",
      "тарифу <b>«Премиум на 30 дней»</b>",
      "пакетом <b>«Профи на 30 дней»</b>",
    ]);
  });
});
