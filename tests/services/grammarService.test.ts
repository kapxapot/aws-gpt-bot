import { getCase, getCaseForNumber } from "../../src/services/grammarService";

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
      getCaseForNumber("секунда", 0),
      getCaseForNumber("секунда", 0.5),
      getCaseForNumber("секунда", 1),
      getCaseForNumber("секунда", 4),
      getCaseForNumber("секунда", 10.25),
      getCaseForNumber("секунда", 59),
      getCaseForNumber("картинка", 10),
      getCaseForNumber("выпуск", 15),
      getCaseForNumber("пакет", 51),
      getCaseForNumber("день", 132),
      getCaseForNumber("пользователь", 5),
      getCaseForNumber("час", 11),
      getCaseForNumber("минута", 4),
      getCaseForNumber("копия", 8),
      getCaseForNumber("слово", 6),
    ]).toEqual([
      "секунд",
      "секунды",
      "секунда",
      "секунды",
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
      getCaseForNumber("секунда", 0.5, "Nominative"),
      getCaseForNumber("секунда", 1, "Nominative"),
      getCaseForNumber("секунда", 2, "Nominative"),
      getCaseForNumber("секунда", 5, "Nominative"),

      getCaseForNumber("секунда", 0.5, "Genitive"),
      getCaseForNumber("секунда", 1, "Genitive"),
      getCaseForNumber("секунда", 2, "Genitive"),
      getCaseForNumber("секунда", 5, "Genitive"),

      getCaseForNumber("секунда", 0.5, "Dative"),
      getCaseForNumber("секунда", 1, "Dative"),
      getCaseForNumber("секунда", 2, "Dative"),
      getCaseForNumber("секунда", 5, "Dative"),

      getCaseForNumber("секунда", 0.5, "Accusative"),
      getCaseForNumber("секунда", 1, "Accusative"),
      getCaseForNumber("секунда", 2, "Accusative"),
      getCaseForNumber("секунда", 5, "Accusative"),

      getCaseForNumber("секунда", 0.5, "Instrumental"),
      getCaseForNumber("секунда", 1, "Instrumental"),
      getCaseForNumber("секунда", 2, "Instrumental"),
      getCaseForNumber("секунда", 5, "Instrumental"),

      getCaseForNumber("секунда", 0.5, "Prepositional"),
      getCaseForNumber("секунда", 1, "Prepositional"),
      getCaseForNumber("секунда", 2, "Prepositional"),
      getCaseForNumber("секунда", 5, "Prepositional"),
    ]).toEqual([
      "секунды", // кто? что? ноль целых пять десятых секунды
      "секунда", // кто? что? одна секунда
      "секунды", // кто? что? две секунды
      "секунд", // кто? что? пять секунд

      "секунд", // кого? чего? ноля целых пяти десятых секунд
      "секунды", // кого? чего? одной секунды
      "секунд", // кого? чего? двух секунд
      "секунд", // кого? чего? пяти секунд

      "секундам", // кому? чему? нолю целых пяти десятым секундам
      "секунде", // кому? чему? одной секунде
      "секундам", // кому? чему? двум секундам
      "секундам", // кому? чему? пяти секундам

      "секунды", // кого? что? ноль целых пять десятых секунды
      "секунду", // кого? что? одну секунду
      "секунды", // кого? что? две секунды
      "секунд", // кого? что? пять секунд

      "секундами", // кем? чем? нолём целых пятью десятыми секундами
      "секундой", // кем? чем? одной секундой
      "секундами", // кем? чем? двумя секундами
      "секундами", // кем? чем? пятью секундами

      "секундах", // (о) ком? (о) чем? (о) ноле целых пяти десятых секундах
      "секунде", // (о) ком? (о) чем? (об) одной секунде
      "секундах", // (о) ком? (о) чем? (о) двух секундах
      "секундах", // (о) ком? (о) чем? (о) пяти секундах
    ]);
  });
});
