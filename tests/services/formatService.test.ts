import { money } from "../../src/entities/money";
import { User } from "../../src/entities/user";
import { formatMoney } from "../../src/services/formatService";
import { testUser } from "../testData";

const user = testUser;

describe("formatMoney", () => {
  test("[ru] should correctly format money", () => {
    expect(
      formatMoney(user, money(124))
    ).toBe("124 рубля");

    expect(
      formatMoney(user, money(10, "USD"), "Instrumental")
    ).toBe("10 долларами");

    expect(
      formatMoney(user, money(11, "EUR"), "Dative")
    ).toBe("11 евро");
  });

  test("[en] should correctly format money", () => {
    const enUser: User = {
      ...user,
      languageCode: "en"
    };

    expect(
      formatMoney(enUser, money(124))
    ).toBe("124 rubles");

    expect(
      formatMoney(enUser, money(10, "USD"), "Instrumental")
    ).toBe("10 dollars");

    expect(
      formatMoney(enUser, money(11, "EUR"), "Dative")
    ).toBe("11 euros");
  });
});
