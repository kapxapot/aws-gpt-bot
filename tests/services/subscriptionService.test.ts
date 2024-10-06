import { at, now } from "../../src/entities/at";
import { freeSubscription } from "../../src/entities/product";
import { UsageStats, User } from "../../src/entities/user";
import { startOfDay, startOfMonth, startOfWeek } from "../../src/services/dateService";
import { gptDefaultModelName } from "../../src/services/modelService";
import { getProductByCode } from "../../src/services/productService";
import { formatSubscriptionDescription, getPrettySubscriptionName } from "../../src/services/subscriptionService";
import { testUser } from "../testData";

const user = testUser;

describe("getPrettySubscriptionName", () => {
  test("should correctly build name", () => {
    expect([
      getPrettySubscriptionName(
        user,
        freeSubscription,
        {
          targetCase: "Genitive"
        }
      ),
      getPrettySubscriptionName(
        user,
        getProductByCode(user, "subscription-premium-30-days"),
        {
          targetCase: "Dative"
        }
      ),
      getPrettySubscriptionName(
        user,
        getProductByCode(user, "bundle-pro-30-days"),
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

describe("formatSubscriptionDescription", () => {
  test("", () => {
    const usageStats: UsageStats = {
      modelUsages: {
        "gpt-default": {
          intervalUsages: {
            "day": {
              count: 3,
              startedAt: at(startOfDay())
            },
            "month": {
              count: 20,
              startedAt: at(startOfMonth())
            },
            "week": {
              count: 10,
              startedAt: at(startOfWeek())
            }
          },
          lastUsedAt: now()
        },
        "dalle3": {
          intervalUsages: {
            "day": {
              count: 1,
              startedAt: at(startOfDay())
            },
            "month": {
              count: 6,
              startedAt: at(startOfMonth())
            },
            "week": {
              count: 2,
              startedAt: at(startOfWeek())
            }
          },
          lastUsedAt: now()
        }
      }
    };

    const user: User = {
      ...testUser,
      usageStats
    };

    expect(
      formatSubscriptionDescription(user, freeSubscription)
    ).toBe(
      `<b>🤑 Тариф «Бесплатный»</b>
🔹 7/10 запросов к <b>${gptDefaultModelName}</b> в день
🔹 130/150 запросов к <b>${gptDefaultModelName}</b> в месяц
🔹 1/3 картинка <b>DALL-E 3</b> в неделю`
    );
  });
});
