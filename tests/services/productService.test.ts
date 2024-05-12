import { now } from "../../src/entities/at";
import { money } from "../../src/entities/money";
import { PurchasedProduct } from "../../src/entities/product";
import { days30 } from "../../src/entities/term";
import { getProductSpan } from "../../src/services/productService";

describe("getProductSpan", () => {
  test("should return product span", () => {
    const product: PurchasedProduct = {
      id: "",
      code: "bundle-creative-30-days",
      details: {
        plan: "creative",
        term: days30,
        type: "bundle"
      },
      displayName: "Творческий на 30 дней",
      name: "Creative Bundle - 30 Days",
      price: money(299),
      purchasedAt: now(),
      usage: {}
    };

    const span = getProductSpan(product);

    expect(span.start).toBeDefined();
    expect(span.end).toBeDefined();
  });
});
