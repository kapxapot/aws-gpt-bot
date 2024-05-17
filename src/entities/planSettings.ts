import { PartialRecord } from "../lib/types";
import { isProd } from "../services/envService";
import { Interval } from "./interval";
import { ModelCode } from "./model";
import { Plan } from "./plan";

export type IntervalLimits = PartialRecord<Interval, number>;
export type ModelLimit = IntervalLimits | number;
type ModelLimits = PartialRecord<ModelCode, ModelLimit>;

export type PlanSettings = {
  limits: ModelLimits;
  disabled?: boolean;
};

export const planSettings: Record<Plan, PlanSettings> = {
  "free": {
    limits: {
      "gpt3": {
        "day": 5,
        "month": 100
      },
      "dalle3": {
        "week": 3
      }
    }
  },
  "premium": {
    disabled: true,
    limits: {
      "gpt3": {
        "day": 100
      }
    }
  },
  "unlimited": {
    disabled: true,
    limits: {
      "gpt3": {
        "day": Number.POSITIVE_INFINITY
      }
    }
  },
  "novice": {
    limits: {
      "gpt3": 200
    }
  },
  "student": {
    limits: {
      "gpt3": 500
    }
  },
  "promo": {
    disabled: true,
    limits: {
      "gptokens": 10
    }
  },
  "trial": {
    limits: {
      "gptokens": 20
    }
  },
  "creative": {
    limits: {
      "gptokens": 50
    }
  },
  "pro": {
    limits: {
      "gptokens": 150
    }
  },
  "boss": {
    limits: {
      "gptokens": 400
    }
  },
  "test-tinygpt3": {
    disabled: isProd(),
    limits: {
      "gpt3": 2
    }
  },
  "test-tinygptokens": {
    disabled: isProd(),
    limits: {
      "gptokens": 4
    }
  }
};
