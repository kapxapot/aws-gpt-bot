import { t } from "../lib/translate";
import { getUserContext } from "../services/userService";
import { User } from "./user";

export const modeCodes = [
  "free",
  "role",
  "prompt"
] as const;

export type ModeCode = typeof modeCodes[number];

export const promptCodes = [
  "idea-generator",
  "psychologist",
  "coach",
  "chef",
  "english-tutor",
  "kids-animator"
] as const;

export type PromptCode = typeof promptCodes[number] | "_none" | "_custom";

export type Mode = {
  code: ModeCode;
  name: string;
  description: string;
};

type PromptDefaults = {
  modeCode: ModeCode;
  promptCode: PromptCode;
};

export type Prompt = {
  code: PromptCode;
  name: string;
  content: string;
  intro: string;
};

export function getPromptDefaults(): PromptDefaults {
  return {
    modeCode: "free",
    promptCode: "_none"
  };
}

export function getPrompts(user: User): Prompt[] {
  return [
    {
      code: "idea-generator",
      name: t(user, "prompts.idea-generator.name"),
      content: t(user, "prompts.idea-generator.content"),
      intro: t(user, "prompts.idea-generator.intro")
    },
    {
      code: "psychologist",
      name: t(user, "prompts.psychologist.name"),
      content: t(user, "prompts.psychologist.content"),
      intro: t(user, "prompts.psychologist.intro")
    },
    {
      code: "coach",
      name: t(user, "prompts.coach.name"),
      content: t(user, "prompts.coach.content"),
      intro: t(user, "prompts.coach.intro")
    },
    {
      code: "chef",
      name: t(user, "prompts.chef.name"),
      content: t(user, "prompts.chef.content"),
      intro: t(user, "prompts.chef.intro")
    },
    {
      code: "english-tutor",
      name: t(user, "prompts.english-tutor.name"),
      content: t(user, "prompts.english-tutor.content"),
      intro: t(user, "prompts.english-tutor.intro")
    },
    {
      code: "kids-animator",
      name: t(user, "prompts.kids-animator.name"),
      content: t(user, "prompts.kids-animator.content"),
      intro: t(user, "prompts.kids-animator.intro")
    }
  ];
}

export function getPromptByCode(user: User, code: PromptCode): Prompt | null {
  return getPrompts(user).find(p => p.code === code) ?? null;
}

export function getModes(user: User): Mode[] {
  return [
    {
      code: "free",
      name: t(user, "modes.free.name"),
      description: t(user, "modes.free.description")
    },
    {
      code: "role",
      name: t(user, "modes.role.name"),
      description: t(user, "modes.role.description")
    },
    {
      code: "prompt",
      name: t(user, "modes.prompt.name"),
      description: t(user, "modes.prompt.description")
    }
  ];
}

export function getModeName(user: User): string | null {
  const context = getUserContext(user);

  if (!context) {
    return t(user, "unknownMode");
  }

  const mode = getModeByCode(user, context.modeCode);

  if (!mode) {
    return getPromptName(user, context.promptCode);
  }

  if (mode.code !== "role") {
    return mode.name;
  }

  return `${mode.name} «${getPromptName(user, context.promptCode)}»`;
}

export function getModeByCode(user: User, code: ModeCode): Mode | null {
  return getModes(user).find(m => m.code === code) ?? null;
}

function getPromptName(user: User, code: PromptCode): string | null {
  if (code === "_custom") {
    const customPrompt = getModeByCode(user, "prompt");

    if (customPrompt) {
      return customPrompt.name;
    }
  }

  return getPromptByCode(user, code)?.name ?? null;
}
