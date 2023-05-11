import { WizardContext, WizardSession } from "telegraf/scenes";

export interface BotContext extends WizardContext {
  session: SessionData & WizardSession;
}

export interface SessionData {
  promptData?: StageData<PromptStage>;
  modeData?: StageData<ModeStage>;
}

export interface StageData<T extends string> {
  stage?: T
}

export type PromptStage = "start" | "customPromptInput" | "promptSelection";
export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";
