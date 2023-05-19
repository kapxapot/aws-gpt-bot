import { now } from "../../src/entities/at";
import { isPurchasedProduct, monthlyPremiumSubscription, monthlyUnlimitedSubscription } from "../../src/entities/product";
import { User } from "../../src/entities/user";
import { getCurrentSubscription } from "../../src/services/planService";

describe('getCurrentSubscription', () => {
  test('should return unlimited sub in case of premium + unlimited', () => {
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
          at: now(),
          details: monthlyUnlimitedSubscription(),
          type: "purchase"
        }
      ]
    };

    const currentSubscription = getCurrentSubscription(user);

    expect(
      isPurchasedProduct(currentSubscription)
    ).toBe(true);

    if (isPurchasedProduct(currentSubscription)) {
      expect(currentSubscription.code).toBe("subscription-unlimited-30-days");
    }
  });
});
