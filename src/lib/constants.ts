export const commands = {
  tutorial: "tutorial",
  mode: "mode",
  premium: "premium",
  image: "image",
  support: "support",
  historySize: "history",
  temperature: "temp",
  status: "status",
  chat: "chat",
  coupons: "coupons",
  invite: "invite",
  products: "products"
} as const;

export const commonMessages = {
  backToChat: "💬 Возвращаемся к диалогу с ChatGPT...",
  useTheKeyboard: "Используйте кнопки диалога. 👆"
} as const;

export const scenes = {
  tutorial: "TUTORIAL_SCENE",
  mode: "MODE_SCENE",
  premium: "PREMIUM_SCENE",
  image: "IMAGE_SCENE",
  coupons: "COUPONS_SCENE"
} as const;

export const settings = {
  historySize: {
    min: 0,
    max: 5,
    default: 3
  },
  temperature: {
    min: 0,
    max: 2,
    default: 0.6
  },
  maxPromptLength: 1000,
  maxImagePromptLength: 1000,
  maxHistoryMessageLength: 200,
  systemTimeOffset: -3, // hours
  telegram: {
    maxMessageLength: 4096,
    maxButtonTextLength: 14
  },
  defaultUsagePoints: 1,
  couponsToShow: 10
} as const;

export const symbols = {
  infinity: "♾",
  gptoken: "🍥",
  bullet: "🔹",
  warning: "⚠",
  coupon: "🎫",
  product: "🛒",
  stop: "⛔",
  cross: "❌",
  success: "✅"
} as const;
