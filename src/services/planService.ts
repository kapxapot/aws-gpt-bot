import { Plan } from "../entities/plan";
import { getPlanSettings } from "./planSettingsService";

export function isPlanActive(plan: Plan) {
  const planSettings = getPlanSettings(plan);
  return planSettings.active;
}

export function getPlanDescription(plan: Plan): string {
  switch (plan) {
    case "free":
      return `Тариф <b>«Бесплатный»</b>:
◽ модель <b>GPT-3</b>
◽ 5 запросов в день
◽ 100 запросов в месяц
◽ 1 запрос к <b>DALL-E 3</b> в неделю`;

    case "premium":
      return `💚 Тариф <b>«Премиум»</b>:
◽ модель <b>GPT-3</b>
◽ до 100 запросов в день
◽ 290 рублей на 30 дней`;

    case "unlimited":
      return `💛 Тариф <b>«Безлимит»</b>:
◽ модель <b>GPT-3</b>
◽️ неограниченное количество запросов
◽️ 390 рублей на 30 дней`;

    case "starter":
      return `💚 Пакет <b>«Начальный»</b>:
◽ модель <b>GPT-3</b>
◽️ 500 запросов
◽️ 199 рублей на 30 дней`;

    case "creative":
      return `💛 Пакет <b>«Творческий»</b>:
◽ модель <b>GPT-4</b>
◽️ 50 запросов к <b>DALL-E 3</b> или 100 запросов к <b>GPT-4</b>
◽️ 299 рублей на 30 дней`;

    case "pro":
      return `💜 Пакет <b>«Профессиональный»</b>:
◽ модель <b>GPT-4</b>
◽️ 150 запросов к <b>DALL-E 3</b> или 300 запросов к <b>GPT-4</b>
◽️ 749 рублей на 30 дней`;
  }
}
