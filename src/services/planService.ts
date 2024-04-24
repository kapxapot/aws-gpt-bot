import { Plan } from "../entities/plan";
import { list, toCompactText } from "../lib/common";
import { gptokenString } from "./gptokenService";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

type DescriptionMode = "full" | "short";

export function getPlanDescription(plan: Plan, mode: DescriptionMode = "full"): string {
  const full = mode === "full";
  const suffix = (text: string, suffix: string) => full ? `${text}${suffix}` : text;
  const iff = (text: string) => full ? text : "";

  switch (plan) {
    case "free":
      return toCompactText(
        "🤑 <b>Тариф «Бесплатный»</b>:",
        ...list(
          iff("модель <b>GPT-3.5</b>"),
          "5 запросов в день",
          "100 запросов в месяц",
          "1 запрос к <b>DALL-E 3</b> в неделю"
        )
      );

    case "premium":
      return toCompactText(
        "💔 <b>Тариф «Премиум»</b>:",
        ...list(
          iff("модель <b>GPT-3.5</b>"),
          "до 100 запросов в день",
          "290 рублей на 30 дней"
        )
      );

    case "unlimited":
      return toCompactText(
        "💔 <b>Тариф «Безлимит»</b>:",
        ...list(
          iff("модель <b>GPT-3.5</b>"),
          "неограниченное количество запросов",
          "390 рублей на 30 дней"
        )
      );

    case "novice":
      return toCompactText(
        "👧 <b>Пакет «Новичок»</b>:",
        ...list(
          suffix("200 запросов", " к модели <b>GPT-3.5</b>"),
          "49 рублей на 30 дней"
        )
      );

    case "student":
      return toCompactText(
        "👨‍🎓 <b>Пакет «Студент»</b>:",
        ...list(
          suffix("500 запросов", " к модели <b>GPT-3.5</b>"),
          "99 рублей на 30 дней"
        )
      );

    case "trial":
      return toCompactText(
        "🧪 <b>Пакет «Пробный»</b>",
        ...list(
          suffix(gptokenString(20), " = 20 запросов к <b>GPT-4</b>"),
          iff("или 10 картинок <b>DALL-E 3</b>"),
          "99 рублей на 30 дней"
        )
      );

    case "creative":
      return toCompactText(
        "👩‍🎨 <b>Пакет «Творческий»</b>",
        ...list(
          suffix(gptokenString(50), " = 50 запросов к <b>GPT-4</b>"),
          iff("или 25 картинок <b>DALL-E 3</b>"),
          "199 рублей на 30 дней"
        )
      );

    case "pro":
      return toCompactText(
        "😎 <b>Пакет «Профи»</b>",
        ...list(
          suffix(gptokenString(150), " = 150 запросов к <b>GPT-4</b>"),
          iff("или 75 картинок <b>DALL-E 3</b>"),
          "449 рублей на 30 дней"
        )
      );

    case "boss":
      return toCompactText(
        "🤴 <b>Пакет «Босс»</b>",
        ...list(
          suffix(gptokenString(400), " = 400 запросов к <b>GPT-4</b>"),
          iff("или 200 картинок <b>DALL-E 3</b>"),
          "999 рублей на 30 дней"
        )
      );

    case "test-tinygpt3":
      return toCompactText(
        "🛠 <b>Тестовый Пакет «Мелкий GPT-3»</b>:",
        ...list(
          suffix("2 запроса", " к модели <b>GPT-3.5</b>"),
          "9999 рублей на 1 день"
        )
      );

    case "test-tinygptokens":
      return toCompactText(
        "🛠 <b>Тестовый Пакет «Мелкий Gptoken»</b>:",
        ...list(
          suffix(gptokenString(4), " = 4 запроса к <b>GPT-4</b>"),
          iff("или 2 запроса к <b>DALL-E 3</b>"),
          "9999 рублей на 1 день"
        )
      );
  }
}
