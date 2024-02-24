import { WizardSession } from "telegraf/scenes";

export type CompoundSession = SessionData & WizardSession;

export type SessionData = {
  modeData?: StageData<ModeStage>;
  imageData?: StageData<ImageStage>;
};

type StageData<T extends string> = {
  stage?: T
};

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";

export type ImageStage = "imagePromptInput";
