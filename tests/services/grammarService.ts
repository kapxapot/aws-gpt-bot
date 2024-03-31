import { getCase } from "../../src/services/grammarService";

describe("getCase", () => {
  test("should get correct case", () => {
    expect(
      getCase("тариф", "Instrumental", "Plural")
    ).toBe("тарифами");
  });
});
