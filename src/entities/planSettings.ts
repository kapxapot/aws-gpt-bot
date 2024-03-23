import { GptModel, ImageModel, ImageSize } from "./model";
import { Plan } from "./plan";

export type PlanSettings = {
  active: boolean;
  text: {
    dailyMessageLimit: number;
    monthlyMessageLimit?: number;
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
      dailyMessageLimit: 5,
      monthlyMessageLimit: 100,
      model: "gpt-3.5-turbo-0125"
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
      model: "gpt-4-0125-preview"
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
      model: "gpt-4-0125-preview"
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
