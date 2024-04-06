import { isPurchasedProduct } from "../../src/entities/product";
import { User } from "../../src/entities/user";
import { getCurrentSubscription } from "../../src/services/subscriptionService";

describe("getCurrentSubscription", () => {
  test("should return newer sub in case of several ones", () => {
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
          displayNames: {
            "Genitive": "Премиума на 30 дней",
            "Nominative": "Премиум на 30 дней"
          },
          name: "Premium Subscription - 30 Days",
          price: {
            amount: 290,
            currency: "RUB"
          },
          purchasedAt: {
            date: "2024-03-06T08:42:57.490Z",
            timestamp: 1709714577490
          },
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
          displayNames: {
            "Genitive": "Творческого на 30 дней",
            "Nominative": "Творческий на 30 дней"
          },
          name: "Creative Bundle - 30 Days",
          price: {
            amount: 299,
            currency: "RUB"
          },
          purchasedAt: {
            date: "2024-04-02T09:58:16.938Z",
            timestamp: 1712051896938
          },
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
});
