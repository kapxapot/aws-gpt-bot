import { getCase, getCaseByNumber } from "../../src/services/grammarService";

describe("getCase", () => {
  test("should get correct case", () => {
    expect([
      getCase("тариф", "Instrumental", "Plural"),
      getCase("пакет", "Genitive"),
    ]).toEqual([
      "тарифами",
      "пакета",
    ]);
  });

  test("should get correct case by number", () => {
    expect([
      getCaseByNumber("секунда", 1),
      getCaseByNumber("секунда", 4),
      getCaseByNumber("секунда", 59),
      getCaseByNumber("картинка", 10),
      getCaseByNumber("выпуск", 15),
      getCaseByNumber("пакет", 51),
      getCaseByNumber("день", 132),
      getCaseByNumber("пользователь", 5),
      getCaseByNumber("час", 11),
      getCaseByNumber("минута", 4),
      getCaseByNumber("копия", 8),
      getCaseByNumber("слово", 6),
    ]).toEqual([
      "секунда",
      "секунды",
      "секунд",
      "картинок",
      "выпусков",
      "пакет",
      "дня",
      "пользователей",
      "часов",
      "минуты",
      "копий",
      "слов",
    ]);
  });

  test("should get correct case by number with target case", () => {
    expect([
      getCaseByNumber("секунда", 1, "Nominative"),
      getCaseByNumber("секунда", 2, "Nominative"),
      getCaseByNumber("секунда", 5, "Nominative"),
      getCaseByNumber("секунда", 1, "Genitive"),
      getCaseByNumber("секунда", 2, "Genitive"),
      getCaseByNumber("секунда", 5, "Genitive"),
      getCaseByNumber("секунда", 1, "Dative"),
      getCaseByNumber("секунда", 2, "Dative"),
      getCaseByNumber("секунда", 5, "Dative"),
      getCaseByNumber("секунда", 1, "Accusative"),
      getCaseByNumber("секунда", 2, "Accusative"),
      getCaseByNumber("секунда", 5, "Accusative"),
      getCaseByNumber("секунда", 1, "Instrumental"),
      getCaseByNumber("секунда", 2, "Instrumental"),
      getCaseByNumber("секунда", 5, "Instrumental"),
      getCaseByNumber("секунда", 1, "Prepositional"),
      getCaseByNumber("секунда", 2, "Prepositional"),
      getCaseByNumber("секунда", 5, "Prepositional"),
    ]).toEqual([
      "секунда", // кто? что? одна секунда
      "секунды", // кто? что? две секунды
      "секунд", // кто? что? пять секунд
      "секунды", // кого? чего? одной секунды
      "секунд", // кого? чего? двух секунд
      "секунд", // кого? чего? пяти секунд
      "секунде", // кому? чему? одной секунде
      "секундам", // кому? чему? двум секундам
      "секундам", // кому? чему? пяти секундам
      "секунду", // кого? что? одну секунду
      "секунды", // кого? что? две секунды
      "секунд", // кого? что? пять секунд
      "секундой", // кем? чем? одной секундой
      "секундами", // кем? чем? двумя секундами
      "секундами", // кем? чем? пятью секундами
      "секунде", // (о) ком? (о) чем? (об) одной секунде
      "секундах", // (о) ком? (о) чем? (о) двух секундах
      "секундах", // (о) ком? (о) чем? (о) пяти секундах
    ]);
  });
});
