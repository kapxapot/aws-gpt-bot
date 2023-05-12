import { WizardContext, WizardSession } from "telegraf/scenes";

export interface BotContext extends WizardContext {
  session: SessionData & WizardSession;
}

export interface SessionData {
  modeData?: StageData<ModeStage>;
}

export interface StageData<T extends string> {
  stage?: T
}

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";
