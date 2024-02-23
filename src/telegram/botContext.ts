import { WizardContext, WizardSession } from "telegraf/scenes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyContext = any;

export type BotContext = WizardContext & {
  session: SessionData & WizardSession;
};

export type SessionData = {
  modeData?: StageData<ModeStage>;
  imageData?: StageData<ImageStage>;
};

export type StageData<T extends string> = {
  stage?: T
};

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";

export type ImageStage = "imagePromptInput";
