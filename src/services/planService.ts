import { Plan } from "../entities/plan";
import { toCompactText } from "../lib/common";
import { gptokenString } from "./gptokenService";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export function getPlanDescription(plan: Plan): string {
  switch (plan) {
    case "free":
      return toCompactText(
        "🤑 <b>Тариф «Бесплатный»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 5 запросов в день",
        "🔹 100 запросов в месяц",
        "🔸 1 запрос к <b>DALL-E 3</b> в неделю"
      );

    case "premium":
      return toCompactText(
        "💔 <b>Тариф «Премиум»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 до 100 запросов в день",
        "🔹 290 рублей на 30 дней"
      );

    case "unlimited":
      return toCompactText(
        "💔 <b>Тариф «Безлимит»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 неограниченное количество запросов",
        "🔹 390 рублей на 30 дней"
      );

    case "novice":
      return toCompactText(
        "👧 <b>Пакет «Новичок»</b>:",
        "🔹 200 запросов к модели <b>GPT-3.5</b>",
        "🔹 49 рублей на 30 дней"
      );

    case "student":
      return toCompactText(
        "👨‍🎓 <b>Пакет «Студент»</b>:",
        "🔹 500 запросов к модели <b>GPT-3.5</b>",
        "🔹 99 рублей на 30 дней"
      );

    case "trial":
      return toCompactText(
        "🧪 <b>Пакет «Пробный»</b>",
        `🔸 ${gptokenString(20)} = 20 запросов к <b>GPT-4</b>`,
        "🔸 или 10 картинок <b>DALL-E 3</b>",
        "🔸 99 рублей на 30 дней"
      );

    case "creative":
      return toCompactText(
        "👩‍🎨 <b>Пакет «Творческий»</b>",
        `🔸 ${gptokenString(50)} = 50 запросов к <b>GPT-4</b>`,
        "🔸 или 25 картинок <b>DALL-E 3</b>",
        "🔸 199 рублей на 30 дней"
      );

    case "pro":
      return toCompactText(
        "😎 <b>Пакет «Профи»</b>",
        `🔸 ${gptokenString(150)} = 150 запросов к <b>GPT-4</b>`,
        "🔸 или 75 картинок <b>DALL-E 3</b>",
        "🔸 449 рублей на 30 дней"
      );

    case "boss":
      return toCompactText(
        "🤴 <b>Пакет «Босс»</b>",
        `🔸 ${gptokenString(400)} = 400 запросов к <b>GPT-4</b>`,
        "🔸 или 200 картинок <b>DALL-E 3</b>",
        "🔸 999 рублей на 30 дней"
      );

    case "test-tinygpt3":
      return toCompactText(
        "🛠 <b>Тестовый Пакет «Мелкий GPT-3»</b>:",
        "🔹 2 запроса к модели <b>GPT-3.5</b>",
        "🔹 9999 рублей на 1 день"
      );

    case "test-tinygptokens":
      return toCompactText(
        "🛠 <b>Тестовый Пакет «Мелкий Gptoken»</b>:",
        `🔸 ${gptokenString(4)} = 4 запроса к <b>GPT-4</b>`,
        "🔸 или 2 запроса к <b>DALL-E 3</b>",
        "🔸 9999 рублей на 1 день"
      );
  }
}
