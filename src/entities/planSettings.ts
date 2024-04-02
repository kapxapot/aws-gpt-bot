import { PartialRecord } from "../lib/types";
import { Interval } from "./interval";
import { Model } from "./model";
import { Plan } from "./plan";

export type IntervalLike = Interval | "product";

type IntervalLimits = PartialRecord<IntervalLike, number>;
export type ModelLimits = PartialRecord<Model, IntervalLimits>;

export type PlanSettings = {
  active: boolean;
  limits?: ModelLimits;
  gptokens?: number;
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
    }
  },
  "premium": {
    active: false,
    limits: {
      "gpt-3.5-turbo-0125": {
        "day": 100
      }
    }
  },
  "unlimited": {
    active: false,
    limits: {
      "gpt-3.5-turbo-0125": {
        "day": Number.POSITIVE_INFINITY
      }
    }
  },
  "starter": {
    active: true,
    limits: {
      "gpt-3.5-turbo-0125": {
        "product": 500
      }
    }
  },
  "creative": {
    active: true,
    gptokens: 100
  },
  "pro": {
    active: true,
    gptokens: 300
  }
};
