import { toText } from "../lib/common";
import { User } from "./user";

export const noPromptCode = "_none";
export const customPromptCode = "_custom";
export const customPromptName = "Свой промт";

export type ModeCode = "free" | "role" | "prompt";

export interface Mode {
  code: ModeCode;
  name: string;
  description: string;
}

const modes: Mode[] = [
  {
    code: "free",
    name: "Свободный диалог",
    description: toText(
      "В этом режиме вы общаетесь с ChatGPT без промта и в памяти удерживается история только 3 последних сообщений и ответов на них. Режим подходит для формата «вопрос-ответ».",
      "Свободный диалог включен по умолчанию при первом запуске бота."
    )
  },
  {
    code: "role",
    name: "Роль",
    description: "В этом режиме я выступаю в одной из заданных ролей. Например, Психолога, Коуча или Генератора идей."
  },
  {
    code: "prompt",
    name: "Свой промт",
    description: "В этом режиме вы можете задать свою инструкцию для ChatGPT."
  }
];

interface Defaults {
  modeCode: ModeCode;
  promptCode: string;
}

export interface Prompt {
  language: "ru" | "en"
  code: string;
  name: string;
  content: string;
  intro: string;
}

const prompts: Prompt[] = [
  {
    language: "ru",
    code: "idea-generator",
    name: "Генератор идей",
    content: toText(
      "Выступай в роли генератора идей.",
      "Подсказывай варианты решения стоящих передо мной задач.",
      "В зависимости от моих ответов, продолжай предлагать идеи.",
      "Начнем с моего следующего сообщения."
    ),
    intro: toText(
      "Нейросеть будет выступать в роли генератора идей и подсказывать варианты решения стоящих перед вами задач.",
      "Напишите, какая у вас задача?"
    )
  },
  {
    language: "ru",
    code: "psychologist",
    name: "Психолог",
    content: toText(
      "Выступай в роли психолога.",
      "Помогай решать мои психологические проблемы и повышать уровень психологического развития.",
      "Начнем с моего следующего сообщения."
    ),
    intro: toText(
      "Нейросеть будет выступать в роли психолога и поможет решить ваши психологические проблемы и повышать уровень психологического развития.",
      "Напишите, что вас сейчас наиболее беспокоит?"
    )
  },
  {
    language: "ru",
    code: "coach",
    name: "Коуч",
    content: toText(
      "Выступай в роли коуча.",
      "Задавай мне вопросы с целью помочь в конкретизации и достижении цели.",
      "Начнем с моего следующего сообщения."
    ),
    intro: toText(
      "Нейросеть будет задавать вопросы с целью помочь в конкретизации и достижении вашей цели.",
      "Напишите, какую цель вы хотели бы достичь?"
    )
  }
];

export function getDefaults(): Defaults {
  return {
    modeCode: "free",
    promptCode: noPromptCode
  };
}

export function getPrompts(): Prompt[] {
  return prompts;
}

export function getPromptByCode(code: string): Prompt | null {
  return prompts.find(p => p.code === code) ?? null;
}

export function getPromptName(code: string): string | null {
  if (code === customPromptCode) {
    return customPromptName;
  }

  return getPromptByCode(code)?.name ?? null;
}

export function getModes(): Mode[] {
  return modes;
}

export function getModeByCode(code: string): Mode | null {
  return modes.find(m => m.code === code) ?? null;
}

export function getModeName(user: User): string | null {
  const context = user.context;

  if (!context) {
    return "Неизвестный режим";
  }

  const mode = getModeByCode(context.modeCode);

  if (!mode) {
    return getPromptName(context.promptCode);
  }

  if (mode.code !== "role") {
    return mode.name;
  }

  return `${mode.name} «${getPromptName(context.promptCode)}»`;
}
