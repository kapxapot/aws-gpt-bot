import { at, now } from "../../src/entities/at";
import { isPurchasedProduct, monthlyPremiumSubscription } from "../../src/entities/product";
import { User } from "../../src/entities/user";
import { addDays } from "../../src/services/dateService";
import { getCurrentSubscription } from "../../src/services/subscriptionService";

describe('getCurrentSubscription', () => {
  // todo: rewrite this (no unlimited anymore)
  test('should return newer sub in case of premium + premium', () => {
    const user: User = {
      id: "",
      telegramId: 1,
      createdAt: 1,
      createdAtIso: "",
      updatedAt: 1,
      updatedAtIso: "",
      events: [
        {
          at: now(),
          details: monthlyPremiumSubscription(),
          type: "purchase"
        },
        {
          at: at(addDays(now(), 1)),
          details: monthlyPremiumSubscription(),
          type: "purchase"
        }
      ]
    };

    const currentSubscription = getCurrentSubscription(user);

    expect(
      isPurchasedProduct(currentSubscription)
    ).toBe(true);

    if (isPurchasedProduct(currentSubscription)) {
      expect(currentSubscription.code).toBe("subscription-premium-30-days");
    }
  });
});
