import { WizardContext, WizardSession } from "telegraf/scenes";

export type BotContext = WizardContext & {
  session: SessionData & WizardSession;
};

export type SessionData = {
  modeData?: StageData<ModeStage>;
};

export type StageData<T extends string> = {
  stage?: T
};

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";
