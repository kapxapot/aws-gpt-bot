import { WizardSession } from "telegraf/scenes";
import { ProductCode } from "../entities/product";

export type CompoundSession = SessionData & WizardSession;

export type SessionData = {
  modeData?: {
    stage?: ModeStage;
  }
  imageData?: {
    stage?: ImageStage;
  }
  premiumData?: {
    targetProductCode?: ProductCode;
  }
};

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";
export type ImageStage = "imagePromptInput" | "oneMore";
