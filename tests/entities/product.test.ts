import { at, now, ts } from "../../src/entities/at";
import { couponProductCodes } from "../../src/entities/coupon";
import { isExpirableProduct } from "../../src/entities/product";
import { legacyProducts } from "../../src/entities/products/legacyProducts";
import { User } from "../../src/entities/user";
import { addMonths } from "../../src/services/dateService";
import { canPurchaseProduct } from "../../src/services/permissionService";
import { getActiveProducts, getProductByCode, isProductActive, productToPurchasedProduct } from "../../src/services/productService";
import { testUser } from "../testData";

const user: User = {
  ...testUser,
  isTester: true
};

describe("legacy products", () => {
  it.each(legacyProducts)("can't be purchased", product => {
    expect(
      canPurchaseProduct(user, product.code)
    ).toBe(false);
  });
});

describe("coupon products", () => {
  it.each(couponProductCodes)("can't be purchased", code => {
    expect(
      canPurchaseProduct(user, code)
    ).toBe(false);
  });

  it.each(couponProductCodes)("is expirable", code => {
    const product = getProductByCode(code);
    const purchasedProduct = productToPurchasedProduct(product, now());

    expect(
      isExpirableProduct(purchasedProduct)
    ).toBe(true);
  });
});

describe("purchasable endless products", () => {
  const activeProducts = getActiveProducts();
  const purchasableProducts = activeProducts.filter(
    product => !couponProductCodes.includes(product.code)
  );

  it.each(purchasableProducts)("can be purchased", product => {
    expect(
      canPurchaseProduct(user, product.code)
    ).toBe(true);
  });

  it.each(purchasableProducts)("is not expirable", product => {
    expect(
      isExpirableProduct(product)
    ).toBe(false);
  });

  test("endless product bought 1 year ago is still active", () => {
    const product = getProductByCode("bundle-boss");
    const purchasedProduct = productToPurchasedProduct(
      product,
      at(addMonths(ts(), -12))
    );

    expect(
      isProductActive(purchasedProduct)
    ).toBe(true);
  });
});
