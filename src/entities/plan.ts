import { GptModel, ImageModel, ImageSize } from "../lib/openai";

export type Plan = "free" | "premium" | "unlimited";

export type PlanSettings = {
  text: {
    dailyMessageLimit: number;
    model: GptModel;
  }
  images: {
    model: ImageModel;
    size: ImageSize;
  }
  permissions: {
    canRequestImageGeneration: boolean;
  }
};

const planSettings: Record<Plan, PlanSettings> = {
  "free": {
    text: {
      dailyMessageLimit: 20,
      model: "gpt-3.5-turbo"
    },
    images: {
      model: "dall-e-3",
      size: "1024x1024"
    },
    permissions: {
      canRequestImageGeneration: false
    }
  },
  "premium": {
    text: {
      dailyMessageLimit: 100,
      model: "gpt-4-1106-preview"
    },
    images: {
      model: "dall-e-3",
      size: "1024x1024"
    },
    permissions: {
      canRequestImageGeneration: true
    }
  },
  "unlimited": {
    text: {
      dailyMessageLimit: Number.POSITIVE_INFINITY,
      model: "gpt-4-1106-preview"
    },
    images: {
      model: "dall-e-3",
      size: "1024x1024"
    },
    permissions: {
      canRequestImageGeneration: true
    }
  }
};

export function getPlanSettings(plan: Plan): PlanSettings {
  return planSettings[plan];
}

export function getPlanDailyMessageLimit(plan: Plan): number {
  const settings = getPlanSettings(plan);
  return settings.text.dailyMessageLimit;
}

export function getPlanGptModel(plan: Plan): GptModel {
  const settings = getPlanSettings(plan);
  return settings.text.model;
}
