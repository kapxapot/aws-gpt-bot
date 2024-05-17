import { money } from "../../src/entities/money";
import { formatMoney } from "../../src/services/moneyService";

describe("formatMoney", () => {
  test("should correctly format money", () => {
    expect(
      formatMoney(money(124))
    ).toBe("124 рубля");

    expect(
      formatMoney(money(10, "USD"), "Instrumental")
    ).toBe("10 долларами");

    expect(
      formatMoney(money(11, "EUR"), "Dative")
    ).toBe("11 евро");
  });
});
