import { User } from "../../src/entities/user";
import { EnWord, orJoin, tWordNumber } from "../../src/lib/translate";
import { Language } from "../../src/lib/types";
import { testUser } from "../testData";

type Data = {
  language: Language;
  word: EnWord;
  num: number;
  result: string;
};

describe("tWordNumber", () => {
  const dataSet: Data[] = [
    {
      language: "en",
      word: "second",
      num: 0,
      result: "0 seconds"
    },
    {
      language: "en",
      word: "second",
      num: 1,
      result: "1 second"
    },
    {
      language: "en",
      word: "second",
      num: 2,
      result: "2 seconds"
    },
    {
      language: "en",
      word: "second",
      num: 3.5,
      result: "3.5 seconds"
    },
    {
      language: "ru",
      word: "second",
      num: 0,
      result: "0 секунд"
    },
    {
      language: "ru",
      word: "second",
      num: 1,
      result: "1 секунда"
    },
    {
      language: "ru",
      word: "second",
      num: 2,
      result: "2 секунды"
    },
    {
      language: "ru",
      word: "second",
      num: 5,
      result: "5 секунд"
    },
    {
      language: "ru",
      word: "second",
      num: 21,
      result: "21 секунда"
    },
    {
      language: "ru",
      word: "second",
      num: 5.46,
      result: "5.46 секунды"
    }
  ];

  it.each(dataSet)(
    "builds a correct localized string",
    ({ language, word, num, result }) => {
      const user: User = {
        ...testUser,
        languageCode: language
      };

      expect(tWordNumber(user, word, num))
        .toBe(result);
    }
  );
});

describe("orJoin", () => {
  test("[Russian] should join string with `или`", () => {
    const user: User = {
      ...testUser,
      languageCode: "ru"
    };
  
    expect(orJoin(user)).toBe("");
    expect(orJoin(user, "a")).toBe("a");
    expect(orJoin(user, "a", "b")).toBe("a или b");
    expect(orJoin(user, "a", "b", "c")).toBe("a, b или c");
    expect(orJoin(user, "a", "b", "c", "d")).toBe("a, b, c или d");
  });

  test("[English] should join string with `, or`", () => {
    const user: User = {
      ...testUser,
      languageCode: "en"
    };
  
    expect(orJoin(user)).toBe("");
    expect(orJoin(user, "a")).toBe("a");
    expect(orJoin(user, "a", "b")).toBe("a, or b");
    expect(orJoin(user, "a", "b", "c")).toBe("a, b, or c");
    expect(orJoin(user, "a", "b", "c", "d")).toBe("a, b, c, or d");
  });
});
