export const commands = {
  tutorial: "tutorial",
  mode: "mode",
  premium: "premium",
  image: "image",
  support: "support",
  historySize: "history",
  temperature: "temp",
  status: "status"
} as const;

export const commonMessages = {
  backToMainDialog: "💬 Возвращаемся к основному диалогу...",
  useTheKeyboard: "Используйте кнопки диалога. 👆"
} as const;

export const scenes = {
  tutorial: "TUTORIAL_SCENE",
  mode: "MODE_SCENE",
  premium: "PREMIUM_SCENE",
  image: "IMAGE_SCENE"
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
  defaultUsagePoints: 1
} as const;

export const symbols = {
  infinity: "♾",
  gptoken: "🍥",
  bullet: "🔹"
} as const;
