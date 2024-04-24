import { freeSubscription } from "../../src/entities/product";
import { getProductByCode, getProductFullDisplayName } from "../../src/services/productService";

describe("getProductFullDisplayName", () => {
  test("should correctly build name", () => {
    expect([
      getProductFullDisplayName(freeSubscription, "Genitive"),
      getProductFullDisplayName(getProductByCode("subscription-premium-30-days"), "Dative"),
      getProductFullDisplayName(getProductByCode("bundle-pro-30-days"), "Instrumental"),
    ]).toEqual([
      "тарифа <b>Бесплатный</b>",
      "тарифу <b>Премиум на 30 дней</b>",
      "пакетом <b>Профи на 30 дней</b>",
    ]);
  });
});
