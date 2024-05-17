import { at, now } from "../../src/entities/at";
import { ConsumptionLimit, IntervalConsumptionLimit, IntervalConsumptionLimits } from "../../src/entities/consumption";
import { ImageSettings, Model, ModelCode, PureModelCode } from "../../src/entities/model";
import { money } from "../../src/entities/money";
import { days } from "../../src/entities/term";
import { User } from "../../src/entities/user";
import { startOfDay, startOfMonth, startOfWeek } from "../../src/services/dateService";
import { getImageModelContexts } from "../../src/services/modelContextService";

const then = now();
const thisDay = at(startOfDay(then));
const thisWeek = at(startOfWeek(then));
const thisMonth = at(startOfMonth(then));

fdescribe("getImageModelContexts", () => {
  test("should return valid contexts", () => {
    const user: User = {
      id: "",
      createdAt: 0,
      createdAtIso: "",
      products: [
        {
          id: "",
          code: "bundle-trial-30-days",
          details: {
            plan: "trial",
            term: days(30),
            type: "bundle"
          },
          displayName: "Пробный на 30 дней",
          name: "Trial Bundle - 30 Days",
          price: money(99),
          purchasedAt: thisMonth,
          shortName: "Пробный",
          usage: {
            gptokens: {
              count: 19,
              intervalUsages: {
                day: {
                  count: 7,
                  startedAt: thisDay
                },
                week: {
                  count: 13,
                  startedAt: thisWeek
                },
                month: {
                  count: 19,
                  startedAt: thisMonth
                }
              }
            }
          }
        }
      ],
      telegramId: 0,
      updatedAt: 0,
      updatedAtIso: "",
      usageStats: {
        modelUsages: {
          dalle3: {
            intervalUsages: {
              day: {
                count: 3,
                startedAt: thisDay
              },
              week: {
                count: 6,
                startedAt: thisWeek
              },
              month: {
                count: 15,
                startedAt: thisMonth
              }
            },
            lastUsedAt: thisDay // doesn't matter here
          },
          gpt4: {
            intervalUsages: {
              day: {
                count: 1,
                startedAt: thisDay
              },
              week: {
                count: 1,
                startedAt: thisWeek
              },
              month: {
                count: 18,
                startedAt: thisMonth
              }
            },
            lastUsedAt: thisDay // doesn't matter here
          }
        }
      },
    };

    const contexts = getImageModelContexts(user);

    expect(contexts.length).toBe(2);

    const [productContext, freeContext] = contexts;

    // productContext
    expect(productContext.product).not.toBeNull();
    expect(productContext.modelCode).toBe<ModelCode>("gptokens");
    expect(productContext.pureModelCode).toBe<PureModelCode>("dalle3");
    expect(productContext.model).toBe<Model>("dall-e-3");

    expect(productContext.imageSettings).toEqual<ImageSettings>({
      size: "1024x1024"
    });

    const productLimit = {
      limit: 20,
      consumed: 19,
      remaining: 1
    };

    expect(productContext.limits).toEqual<ConsumptionLimit>(productLimit);
    expect(productContext.activeLimit).toEqual<ConsumptionLimit>(productLimit);
    expect(productContext.usagePoints).toBe(2);
    expect(productContext.usable).toBe(false);

    // freeContext
    expect(freeContext.product).toBeNull();
    expect(freeContext.modelCode).toBe<ModelCode>("dalle3");
    expect(freeContext.pureModelCode).toBe<PureModelCode>("dalle3");
    expect(freeContext.model).toBe<Model>("dall-e-3");

    expect(freeContext.imageSettings).toEqual<ImageSettings>({
      size: "1024x1024"
    });

    const freeLimit: IntervalConsumptionLimit = { 
      interval: "week",
      limit: 3,
      consumed: 6,
      remaining: 0
    };

    expect(freeContext.limits).toEqual<IntervalConsumptionLimits>([freeLimit]);
    expect(freeContext.activeLimit).toEqual<IntervalConsumptionLimit>(freeLimit);
    expect(freeContext.usagePoints).toBe(1);
    expect(freeContext.usable).toBe(false);
  });
});
