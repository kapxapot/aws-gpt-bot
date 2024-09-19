import { happened, ts } from "../../src/entities/at";
import { addMinutes } from "../../src/services/dateService";

describe("happened", () => {
  test("is false for a future date", () => {
    const now = ts();
    const t = addMinutes(now, 1);
    expect(happened(t, now)).toBe(false);
  });

  test("is true for the same date", () => {
    const now = ts();
    expect(happened(now, now)).toBe(true);
  });

  test("is true for a past date", () => {
    const now = ts();
    const t = addMinutes(now, -1);
    expect(happened(t, now)).toBe(true);
  });
});
