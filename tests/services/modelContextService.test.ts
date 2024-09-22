import { at, now } from "../../src/entities/at";
import { ConsumptionLimit, IntervalConsumptionLimit, IntervalConsumptionLimits } from "../../src/entities/consumption";
import { ImageSettings, Model, ModelCode, PureModelCode } from "../../src/entities/model";
import { money } from "../../src/entities/money";
import { ExpirableProduct, PurchasedProduct } from "../../src/entities/product";
import { days } from "../../src/entities/term";
import { User } from "../../src/entities/user";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../../src/services/dateService";
import { getImageModelContexts, getUsableModelContext } from "../../src/services/modelContextService";
import { isProductActive } from "../../src/services/productService";
import { testUser } from "../testData";

const then = now();
const thisDay = at(startOfDay(then));
const thisWeek = at(startOfWeek(then));
const thisMonth = at(startOfMonth(then));

const yesterday = at(addDays(thisDay, -1));

describe("getImageModelContexts", () => {
  test("should return valid contexts", () => {
    const product: ExpirableProduct = {
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
    };

    const user: User = {
      ...testUser,
      products: [product],
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

    expect(isProductActive(product)).toBe(true);

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

describe("getUsableModelContext", () => {
  test("both expirable: returns recently bought", () => {
    const olderProduct: ExpirableProduct = {
      id: "older",
      code: "bundle-trial-30-days",
      details: {
        plan: "trial",
        term: days(30),
        type: "bundle"
      },
      displayName: "Пробный на 30 дней",
      name: "Trial Bundle - 30 Days",
      price: money(99),
      purchasedAt: yesterday,
      shortName: "Пробный",
      usage: {}
    };

    const newerProduct: ExpirableProduct = {
      ...olderProduct,
      id: "newer",
      purchasedAt: thisDay
    };

    const user: User = {
      ...testUser,
      products: [olderProduct, newerProduct],
    };

    const contexts = getImageModelContexts(user);
    const usableContext = getUsableModelContext(contexts);

    expect(usableContext?.product?.id).toBe("newer");
  });

  test("both endless: returns recently bought", () => {
    const olderProduct: PurchasedProduct = {
      id: "older",
      code: "bundle-trial",
      name: "Trial Bundle",
      shortName: "Пробный",
      displayName: "Пробный",
      icon: "🧪",
      price: money(99),
      details: {
        type: "bundle",
        plan: "trial"
      },
      purchasedAt: yesterday,
      usage: {}
    };

    const newerProduct: PurchasedProduct = {
      ...olderProduct,
      id: "newer",
      purchasedAt: thisDay
    };

    const user: User = {
      ...testUser,
      products: [olderProduct, newerProduct],
    };

    const contexts = getImageModelContexts(user);
    const usableContext = getUsableModelContext(contexts);

    expect(usableContext?.product?.id).toBe("newer");
  });

  // expirable product is bought first, but is returned as usable
  // instead of the endless one that is bought later
  test("expirable + endless: returns expirable", () => {
    const expirableProduct: ExpirableProduct = {
      id: "expiring_older",
      code: "bundle-trial-30-days",
      details: {
        plan: "trial",
        term: days(30),
        type: "bundle"
      },
      displayName: "Пробный на 30 дней",
      name: "Trial Bundle - 30 Days",
      price: money(99),
      purchasedAt: yesterday,
      shortName: "Пробный",
      usage: {}
    };

    const endlessProduct: PurchasedProduct = {
      id: "endless_newer",
      code: "bundle-trial",
      name: "Trial Bundle",
      shortName: "Пробный",
      displayName: "Пробный",
      icon: "🧪",
      price: money(99),
      details: {
        type: "bundle",
        plan: "trial"
      },
      purchasedAt: thisDay,
      usage: {}
    };

    const user: User = {
      ...testUser,
      products: [endlessProduct, expirableProduct]
    };

    const contexts = getImageModelContexts(user);
    const usableContext = getUsableModelContext(contexts);

    expect(usableContext?.product?.id).toBe("expiring_older");
  });
});
