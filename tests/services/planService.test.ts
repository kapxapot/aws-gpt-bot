import { at, now } from "../../src/entities/at";
import { money } from "../../src/entities/money";
import { freeSubscription, isPurchasedProduct } from "../../src/entities/product";
import { User } from "../../src/entities/user";
import { addDays } from "../../src/services/dateService";
import { getCurrentSubscription } from "../../src/services/subscriptionService";

const then = now();
const before = at(addDays(then, -1));

const old = at(addDays(then, -50));

describe("getCurrentSubscription", () => {
  test("should return newer product in case of active products", () => {
    const user: User = {
      id: "",
      telegramId: 1,
      createdAt: 1,
      createdAtIso: "",
      updatedAt: 1,
      updatedAtIso: "",
      products: [
        {
          id: "",
          code: "subscription-premium-30-days",
          details: {
            plan: "premium",
            term: {
              range: 30,
              unit: "day"
            },
            type: "subscription"
          },
          displayName: "Премиум на 30 дней",
          name: "Premium Subscription - 30 Days",
          price: money(290),
          purchasedAt: before,
          usage: {}
        },
        {
          id: "",
          code: "bundle-creative-30-days",
          details: {
            plan: "creative",
            term: {
              range: 30,
              unit: "day"
            },
            type: "bundle"
          },
          displayName: "Творческий на 30 дней",
          name: "Creative Bundle - 30 Days",
          price: money(299),
          purchasedAt: then,
          usage: {}
        }
      ]
    };

    const currentSubscription = getCurrentSubscription(user);

    expect(
      isPurchasedProduct(currentSubscription)
    ).toBe(true);

    if (isPurchasedProduct(currentSubscription)) {
      expect(currentSubscription.code).toBe("bundle-creative-30-days");
    }
  });

  test("should return free sub in case of an expired product", () => {
    const user: User = {
      id: "",
      telegramId: 1,
      createdAt: 1,
      createdAtIso: "",
      updatedAt: 1,
      updatedAtIso: "",
      products: [
        {
          id: "",
          code: "bundle-creative-30-days",
          details: {
            plan: "creative",
            term: {
              range: 30,
              unit: "day"
            },
            type: "bundle"
          },
          displayName: "Творческий на 30 дней",
          name: "Creative Bundle - 30 Days",
          price: money(299),
          purchasedAt: old,
          usage: {}
        }
      ]
    };

    const currentSubscription = getCurrentSubscription(user);

    expect(currentSubscription).toBe(freeSubscription);
  });

  test("should return free sub in case of no products", () => {
    const user: User = {
      id: "",
      telegramId: 1,
      createdAt: 1,
      createdAtIso: "",
      updatedAt: 1,
      updatedAtIso: ""
    };

    const currentSubscription = getCurrentSubscription(user);

    expect(currentSubscription).toBe(freeSubscription);
  });
});
