import { WizardSession } from "telegraf/scenes";
import { Plan } from "../entities/plan";

export type CompoundSession = SessionData & WizardSession;

export type SessionData = {
  modeData?: {
    stage?: ModeStage;
  }
  imageData?: {
    stage?: ImageStage;
  }
  premiumData?: {
    targetPlan?: Plan;
  }
};

export type ModeStage = "modeSelection" | "roleSelection" | "customPromptInput" | "promptSelection";
export type ImageStage = "imagePromptInput";
