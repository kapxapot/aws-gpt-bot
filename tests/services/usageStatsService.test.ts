import { getLastUsedAt } from "../../src/services/usageStatsService";

describe("getLastUsedAt", () => {
  test("should return null for empty usage stats", () => {
    expect(
      getLastUsedAt(undefined, "gpt-3.5-turbo-0125")
    ).toBeNull();
  });
});
