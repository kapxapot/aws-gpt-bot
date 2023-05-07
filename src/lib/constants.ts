export const commands = {
  tutorial: "tutorial",
  prompt: "prompt",
  support: "support",
  terms: "terms",
  premium: "premium",
  historySize: "history",
  temperature: "temp"
} as const;

export const messages = {
  backToAI: "Возвращаемся к диалогу...",
  useTheKeyboard: "Используйте кнопки диалога. 👆"
} as const;

export const scenes = {
  prompt: "PROMPT_SCENE",
  tutorial: "TUTORIAL_SCENE",
  premium: "PREMIUM_SCENE"
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
  }
} as const;
