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
      "gpt-default": {
        "day": 10,
        "month": 150
      },
      "dalle3": {
        "week": 3
      }
    }
  },
  "novice-mini": {
    limits: {
      "gpt-default": 200
    }
  },
  "student-mini": {
    limits: {
      "gpt-default": 500
    }
  },
  "promo": {
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
  // test
  "test-tinygptokens": {
    disabled: isProd(),
    limits: {
      "gptokens": 4
    }
  },
  // legacy
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
    disabled: true,
    limits: {
      "gpt3": 200
    }
  },
  "student": {
    disabled: true,
    limits: {
      "gpt3": 500
    }
  },
  "test-tinygpt3": {
    disabled: true,
    limits: {
      "gpt3": 2
    }
  }
};
