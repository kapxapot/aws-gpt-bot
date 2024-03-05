import { GptModel, ImageModel, ImageSize } from "../lib/openai";
import { Plan } from "./plan";

export type PlanSettings = {
  active: boolean;
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

export const planSettings: Record<Plan, PlanSettings> = {
  "free": {
    active: true,
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
    active: true,
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
    active: false,
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
