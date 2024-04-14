import { Plan } from "../entities/plan";
import { toCompactText } from "../lib/common";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return !planSettings.disabled;
}

export function getPlanDescription(plan: Plan): string {
  switch (plan) {
    case "free":
      return toCompactText(
        "🤑 Тариф <b>«Бесплатный»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 5 запросов в день",
        "🔹 100 запросов в месяц",
        "🔸 1 запрос к <b>DALL-E 3</b> в неделю"
      );

    case "premium":
      return toCompactText(
        "💔 Тариф <b>«Премиум»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 до 100 запросов в день",
        "💳 290 рублей на 30 дней"
      );

    case "unlimited":
      return toCompactText(
        "💔 Тариф <b>«Безлимит»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔸 неограниченное количество запросов",
        "💳 390 рублей на 30 дней"
      );

    case "novice":
      return toCompactText(
        "👧 Пакет <b>«Новичок»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 200 запросов",
        "💳 49 рублей на 30 дней"
      );

    case "student":
      return toCompactText(
        "👨‍🎓 Пакет <b>«Студент»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 500 запросов",
        "💳 99 рублей на 30 дней"
      );

    case "trial":
      return toCompactText(
        "🧪 Пакет <b>«Пробный»</b>",
        "📀 20 гптокенов",
        "🔸 = 10 картинок <b>DALL-E 3</b>",
        "🔸 = 20 запросов к <b>GPT-4</b>",
        "💳 99 рублей на 30 дней"
      );

    case "creative":
      return toCompactText(
        "👩‍🎨 Пакет <b>«Творческий»</b>",
        "📀 50 гптокенов",
        "🔸 = 25 картинок <b>DALL-E 3</b>",
        "🔸 = 50 запросов к <b>GPT-4</b>",
        "💳 199 рублей на 30 дней"
      );

    case "pro":
      return toCompactText(
        "😎 Пакет <b>«Профи»</b>",
        "📀 150 гптокенов",
        "🔸 = 75 картинок <b>DALL-E 3</b>",
        "🔸 = 150 запросов к <b>GPT-4</b>",
        "💳 449 рублей на 30 дней"
      );

    case "boss":
      return toCompactText(
        "🤴 Пакет <b>«Босс»</b>",
        "📀 400 гптокенов",
        "🔸 = 200 картинок <b>DALL-E 3</b>",
        "🔸 = 400 запросов к <b>GPT-4</b>",
        "💳 999 рублей на 30 дней"
      );

    case "test-tinygpt3":
      return toCompactText(
        "🛠 Тестовый Пакет <b>«Мелкий GPT-3»</b>:",
        "🔹 модель <b>GPT-3.5</b>",
        "🔹 2 запроса",
        "💳 9999 рублей на 1 день"
      );

    case "test-tinygptokens":
      return toCompactText(
        "🛠 Тестовый Пакет <b>«Мелкий Gptoken»</b>:",
        "📀 4 гптокена",
        "🔸 = 2 запроса к <b>DALL-E 3</b>",
        "🔸 = 4 запроса к <b>GPT-4</b>",
        "💳 9999 рублей на 1 день"
      );
  }
}
