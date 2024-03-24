import { now } from "../../src/entities/at";
import { UsageStats } from "../../src/entities/user";
import { getLastUsedAt, getModelUsage } from "../../src/services/usageStatsService";

const then = now();

const fakeUsageStats: UsageStats = {
  modelUsages: {
    "gpt-3.5-turbo-0125": {
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

const deprecatedUsageStats: UsageStats = {
  startOfDay: then.timestamp,
  messageCount: 1,
  lastMessageAt: then
};

describe("getLastUsedAt", () => {
  test("should return null for empty usage stats", () => {
    expect(
      getLastUsedAt(undefined, "gpt-3.5-turbo-0125")
    ).toBeNull();
  });

  test("should return null for undefined models usage", () => {
    expect(
      getLastUsedAt({}, "gpt-3.5-turbo-0125")
    ).toBeNull();
  });

  test("should return null for a missing model usage", () => {
    expect(
      getLastUsedAt(fakeUsageStats, "gpt-4-0125-preview")
    ).toBeNull();
  });

  test("should return a value for a defined model usage", () => {
    expect(
      getLastUsedAt(fakeUsageStats, "gpt-3.5-turbo-0125")
    ).toEqual(getModelUsage(fakeUsageStats, "gpt-3.5-turbo-0125")?.lastUsedAt);
  });

  test("should return a value for legacy gpt-3 usage", () => {
    expect(
      getLastUsedAt(deprecatedUsageStats, "gpt-3.5-turbo-0125")
    ).toEqual(deprecatedUsageStats.lastMessageAt);
  });

  test("should return null for other models for legacy data", () => {
    expect(
      getLastUsedAt(deprecatedUsageStats, "gpt-4-0125-preview")
    ).toBeNull();
  });
});
