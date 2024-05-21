import { MoneyLike, overprice, toMoney } from "../entities/money";
import { Plan } from "../entities/plan";
import { Term, days } from "../entities/term";
import { StringLike, toCompactText } from "../lib/common";
import { bulletize } from "../lib/text";
import { gptokenString } from "./gptokenService";
import { formatWordNumber } from "./grammarService";
import { formatMoney } from "./moneyService";
import { getPlanSettings } from "./planSettingsService";
import { formatTerm } from "./termService";

export type DescriptionMode = "short" | "long";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export function getPlanDescription(plan: Plan, mode?: DescriptionMode): string {
  mode = mode || "short";

  const price = (money: MoneyLike, term?: Term) => {
    return (mode !== "short")
      ? `${formatMoney(toMoney(money))} на ${formatTerm(term ?? days(30), "Accusative")}`
      : null;
  };

  const gptokenLines = (gptokens: number, money: MoneyLike, term?: Term) => [
    gptokenString(gptokens),
    price(money, term)
  ];

  switch (plan) {
    case "free":
      return buildDescription(
        "🤑",
        "Тариф «Бесплатный»",
        `${formatWordNumber("запрос", 5)} в день`,
        `${formatWordNumber("запрос", 100)} в месяц`,
        `${formatWordNumber("запрос", 3)} к <b>DALL-E 3</b> в неделю`
      );

    case "premium":
      return buildDescription(
        "💔",
        "Тариф «Премиум»",
        `до ${formatWordNumber("запрос", 100, "Genitive")} в день`,
        price(290)
      );

    case "unlimited":
      return buildDescription(
        "💔",
        "Тариф «Безлимит»",
        "неограниченное количество запросов",
        price(390)
      );

    case "novice":
      return buildDescription(
        "👧",
        "Пакет «Новичок»",
        formatWordNumber("запрос", 200),
        price(49)
      );

    case "student":
      return buildDescription(
        "👨‍🎓",
        "Пакет «Студент»",
        formatWordNumber("запрос", 500),
        price(99)
      );

    case "promo":
      return buildDescription(
        "🎫",
        "Пакет «Промо»",
        ...gptokenLines(10, overprice)
      );

    case "trial":
      return buildDescription(
        "🧪",
        "Пакет «Пробный»",
        ...gptokenLines(20, 99)
      );

    case "creative":
      return buildDescription(
        "👩‍🎨",
        "Пакет «Творческий»",
        ...gptokenLines(50, 199)
      );

    case "pro":
      return buildDescription(
        "😎",
        "Пакет «Профи»",
        ...gptokenLines(150, 449)
      );

    case "boss":
      return buildDescription(
        "🤴",
        "Пакет «Босс»",
        ...gptokenLines(400, 999)
      );

    case "test-tinygpt3":
      return buildDescription(
        "🛠",
        "Тестовый Пакет «Мелкий GPT-3»",
        formatWordNumber("запрос", 2),
        price(overprice, days(1))
      );

    case "test-tinygptokens":
      return buildDescription(
        "🛠",
        "Тестовый Пакет «Мелкий Gptoken»",
        ...gptokenLines(4, overprice, days(1))
      );
  }
}

const buildDescription = (icon: string, name: string, ...lines: StringLike[]) =>
  toCompactText(
    `${icon} <b>${name}</b>`,
    ...bulletize(...lines)
  );
