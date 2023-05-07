export const customPromptCode = "_custom";
export const customPromptName = "Свой промт";

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
    content: "Выступай в роли генератора идей. Подсказывай варианты решения стоящих передо мной задач. В зависимости от моих ответов, продолжай вести диалог, как это сделал генератор идей.",
    intro: `Нейросеть будет выступать в роли генератора идей и подсказывать варианты решения стоящих перед вами задач.

Напишите, какая у вас задача?`
  },
  {
    language: "ru",
    code: "psychologist",
    name: "Психолог",
    content: "Выступай в роли психолога. Помогай мне решить мои проблемы и повысить уровень психологического развития. В зависимости от моих ответов, продолжай вести диалог, как это сделал бы психолог.",
    intro: `Нейросеть будет выступать в роли психолога и поможет решить ваши психологические проблемы и повышать уровень психологического развития.

Напишите, что вас сейчас наиболее беспокоит?`
  },
  {
    language: "ru",
    code: "coach",
    name: "Коуч",
    content: "Выступай в роли коуча. Задавай мне по одному вопросу, с целью помочь мне в конкретизации и достижении моей цели. В зависимости от моих ответов, продолжай вести диалог, как это сделал бы коуч.",
    intro: `Нейросеть будет задавать вопросы с целью помочь в конкретизации и достижении вашей цели.

Напишите, какую цель вы хотели бы достичь?`
  }
];

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

export function getDefaultPromptCode() {
  return customPromptCode;
}
