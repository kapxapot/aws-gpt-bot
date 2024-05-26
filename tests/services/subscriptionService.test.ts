import { freeSubscription } from "../../src/entities/product";
import { getProductByCode } from "../../src/services/productService";
import { getPrettySubscriptionName } from "../../src/services/subscriptionService";

describe("getPrettySubscriptionName", () => {
  test("should correctly build name", () => {
    expect([
      getPrettySubscriptionName(
        freeSubscription,
        {
          targetCase: "Genitive"
        }
      ),
      getPrettySubscriptionName(
        getProductByCode("subscription-premium-30-days"),
        {
          targetCase: "Dative"
        }
      ),
      getPrettySubscriptionName(
        getProductByCode("bundle-pro-30-days"),
        {
          targetCase: "Instrumental"
        }
      ),
    ]).toEqual([
      "🤑 Тарифа «Бесплатный»",
      "💔 Тарифу «Премиум»",
      "😎 Пакетом «Профи»"
    ]);
  });
});
