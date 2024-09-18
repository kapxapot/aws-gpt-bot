import { User } from "../../src/entities/user";
import { canPurchaseProduct } from "../../src/services/permissionService";
import { testUser } from "../testData";

const user: User = {
  ...testUser,
  isTester: true
};

describe("legacy products", () => {
  test("can't be purchased", () => {
    expect(
      canPurchaseProduct(user, "subscription-premium-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "subscription-unlimited-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-novice-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-student-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-novice-mini-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-student-mini-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-creative-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-pro-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-boss-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "test-bundle-tiny-gpt3-1-day")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "test-bundle-tiny-gptokens-1-day")
    ).toBe(false);
  });
});

describe("coupon products", () => {
  test("can't be purchased", () => {
    expect(
      canPurchaseProduct(user, "bundle-promo-30-days")
    ).toBe(false);

    expect(
      canPurchaseProduct(user, "bundle-promo-30-days")
    ).toBe(false);
  });
});

describe("active products", () => {
  test("can be purchased", () => {
    expect(
      canPurchaseProduct(user, "bundle-novice-mini")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "bundle-student-mini")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "bundle-trial")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "bundle-creative")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "bundle-pro")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "bundle-boss")
    ).toBe(true);

    expect(
      canPurchaseProduct(user, "test-bundle-tiny-gptokens")
    ).toBe(true);
  });
});
