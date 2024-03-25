import { Interval } from "./interval";
import { ImageModel, ImageSize, Model } from "./model";
import { Plan } from "./plan";

type IntervalLimits = Partial<Record<Interval, number>>;
type ModelLimits = Partial<Record<Model, IntervalLimits>>;
type ImageVariants = Partial<Record<ImageModel, ImageSize[]>>;

export type PlanSettings = {
  active: boolean;
  limits: ModelLimits;
  imageVariants: ImageVariants;
  permissions: {
    canRequestImageGeneration: boolean;
  }
};

export const planSettings: Record<Plan, PlanSettings> = {
  "free": {
    active: true,
    limits: {
      "gpt-3.5-turbo-0125": {
        "day": 5,
        "month": 100
      },
      "dall-e-3": {
        "week": 1
      }
    },
    imageVariants: {
      "dall-e-3": ["1024x1024"]
    },
    permissions: {
      canRequestImageGeneration: true
    }
  },
  "premium": {
    active: true,
    limits: {
      "gpt-4-0125-preview": {
        "day": 20,
        "month": 200
      },
      "dall-e-3": {
        "week": 10
      }
    },
    imageVariants: {
      "dall-e-3": ["1024x1024", "1024x1792", "1792x1024"]
    },
    permissions: {
      canRequestImageGeneration: true
    }
  }
};
