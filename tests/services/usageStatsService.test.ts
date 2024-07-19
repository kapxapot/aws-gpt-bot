import { at, now } from "../../src/entities/at";
import { UsageStats } from "../../src/entities/user";
import { startOfDay, startOfMonth, startOfWeek } from "../../src/services/dateService";
import { getLastUsedAt, getModelUsage, getUsageCount } from "../../src/services/usageStatsService";

const then = now();

const fakeUsageStats: UsageStats = {
  modelUsages: {
    "gpt3": {
      lastUsedAt: then,
      intervalUsages: {
        "day": {
          startedAt: then,
          count: 1
        }
      }
    }
  }
};

describe("getLastUsedAt", () => {
  test("should return null for empty usage stats", () => {
    expect(
      getLastUsedAt(undefined, "gpt3")
    ).toBeNull();
  });

  test("should return null for undefined models usage", () => {
    expect(
      getLastUsedAt({}, "gpt3")
    ).toBeNull();
  });

  test("should return null for a missing model usage", () => {
    expect(
      getLastUsedAt(fakeUsageStats, "gpt4")
    ).toBeNull();
  });

  test("should return a value for a defined model usage", () => {
    expect(
      getLastUsedAt(fakeUsageStats, "gpt3")
    ).toEqual(getModelUsage(fakeUsageStats, "gpt3")?.lastUsedAt);
  });
});

describe("getUsageCount", () => {
  test("should get correct usage count", () => {
    const usageStats: UsageStats = {
      modelUsages: {
        "gpt3": {
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
      }
    };

    expect(
      getUsageCount(usageStats, "gpt3", "day")
    ).toBe(3);

    expect(
      getUsageCount(usageStats, "gpt3", "week")
    ).toBe(10);

    expect(
      getUsageCount(usageStats, "gpt3", "month")
    ).toBe(20);
  });
});
