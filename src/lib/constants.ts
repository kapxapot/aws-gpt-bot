export const commands = {
  tutorial: "tutorial",
  prompt: "prompt",
  support: "support",
  terms: "terms",
  premium: "premium"
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
