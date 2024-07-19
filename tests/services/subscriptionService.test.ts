import { at, now } from "../../src/entities/at";
import { freeSubscription } from "../../src/entities/product";
import { UsageStats, User } from "../../src/entities/user";
import { startOfDay, startOfMonth, startOfWeek } from "../../src/services/dateService";
import { gptDefaultModelName } from "../../src/services/modelService";
import { getProductByCode } from "../../src/services/productService";
import { formatSubscriptionDescription, getPrettySubscriptionName } from "../../src/services/subscriptionService";

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
      id: "",
      telegramId: 0,
      createdAt: 0,
      createdAtIso: "",
      updatedAt: 0,
      updatedAtIso: "",
      usageStats
    };

    expect(
      formatSubscriptionDescription(freeSubscription, user)
    ).toBe(
      `<b>🤑 Тариф «Бесплатный»</b>
🔹 7/10 запросов к <b>${gptDefaultModelName}</b> в день
🔹 130/150 запросов к <b>${gptDefaultModelName}</b> в месяц
🔹 1/3 картинка <b>DALL-E 3</b> в неделю`
    );
  });
});
