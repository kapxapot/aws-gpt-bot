import { toText } from "../lib/common";
import { getContext } from "../services/userService";
import { User } from "./user";

export const noPromptCode = "_none";
export const customPromptCode = "_custom";
export const customPromptName = "Свой промт";

export type ModeCode = "free" | "role" | "prompt";

export type Mode = {
  code: ModeCode;
  name: string;
  description: string;
};

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

type PromptDefaults = {
  modeCode: ModeCode;
  promptCode: string;
};

export type Prompt = {
  language: "ru" | "en"
  code: string;
  name: string;
  content: string;
  intro: string;
};

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
  },
  {
    language: "ru",
    code: "chef",
    name: "Повар",
    content: toText(
      "Act as a chef.",
      "Offer recipes for dishes from the ingredients I have.",
      "Let's start with my next post.",
      "Веди разговор на русском."
    ),
    intro: toText(
      "Нейросеть будет предлагать вам рецепты блюд из имеющихся у вас ингредиентов.",
      "Напишите, какие продукты у вас есть?"
    )
  },
  {
    language: "ru",
    code: "english-tutor",
    name: "Репетитор по английскому языку",
    content: toText(
      "I want you to act as a spoken English teacher and improver. I will speak to you in English and you will reply to me in English to practice my spoken English. I want you to keep your reply neat, limiting the reply to 100 words. I want you to strictly correct my grammar mistakes, typos, and factual errors. I want you to ask me a question in your reply. Now let's start practicing, you could ask me a question first. Remember, I want you to strictly correct my grammar mistakes, typos, and factual errors.",
      "I will set the level of language proficiency: beginner, intermediate or advanced, and you communicate with me according to this level.",
      "Duplicate each of your answers in Russian."
    ),
    intro: toText(
      "Нейросеть будет отвечать вам как носитель языка и исправлять ваши ошибки, чтобы вы практиковали свой английский.",
      "Для старта — напишите свой уровень владения английским языком (начальный, средний, продвинутый) и свое первое предложение."
    )
  },
  {
    language: "ru",
    code: "kids-animator",
    name: "Аниматор для детей",
    content: "Выступи в роли аниматора для детей. Придумай варианты игры для детей и их родителей, которые не требуют специального оборудования, имеют простые правила, веселые и могут быть сыграны в дороге. Я буду указывать количество игроков и их возраст, а ты составь список игр, подходящих под эти параметры. Представь ответ в виде списка игр, представь их пронумерованными. Каждый вариант сделай по структуре Название игры, примерная продолжительность игры, подробные правила игры.",
    intro: toText(
      "Нейросеть будет предлагать вам игры для детей и их родителей, которые не требуют специального оборудования, имеют простые правила, веселые и могут быть сыграны в дороге.",
      "Напишите количество игроков и возраст самого младшего из них."
    )
  }
];

export function getPromptDefaults(): PromptDefaults {
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
  const context = getContext(user);

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
