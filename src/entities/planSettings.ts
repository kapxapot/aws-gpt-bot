import { PartialRecord } from "../lib/types";
import { isProd } from "../services/envService";
import { Interval } from "./interval";
import { ModelCode } from "./model";
import { Plan } from "./plan";

type IntervalLimits = PartialRecord<Interval, number>;
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
        "week": 1
      }
    }
  },
  "premium": {
    limits: {
      "gpt3": {
        "day": 100
      }
    },
    disabled: true
  },
  "unlimited": {
    limits: {
      "gpt3": {
        "day": Number.POSITIVE_INFINITY
      }
    },
    disabled: true
  },
  "starter": {
    limits: {
      "gpt3": 500
    }
  },
  "creative": {
    limits: {
      "gptokens": 100
    }
  },
  "pro": {
    limits: {
      "gptokens": 300
    }
  },
  "test-tinygpt3": {
    limits: {
      "gpt3": 2
    },
    disabled: isProd()
  },
  "test-tinygptokens": {
    limits: {
      "gptokens": 4
    },
    disabled: isProd()
  }
};
