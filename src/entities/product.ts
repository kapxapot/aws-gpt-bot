import { PartialRecord } from "../lib/types";
import { At } from "./at";
import { GrammarCase, KnownWord } from "./grammar";
import { ProductUsage } from "./modelUsage";
import { Money } from "./money";
import { Plan, defaultPlan } from "./plan";

export type ProductType = "subscription" | "bundle";

export const productTypeDisplayNames: Record<ProductType, KnownWord> = {
  "subscription": "тариф",
  "bundle": "пакет"
};

export type Subscription = {
  name: string;
  displayName?: string;
  /** @deprecated Remove in >1 month after 0.2 release */
  displayNames?: PartialRecord<GrammarCase, string>;
  details: {
    type: ProductType;
    plan: Plan;
  };
};

export const productCodes = [
  "subscription-premium-30-days",
  "subscription-unlimited-30-days",
  "bundle-novice-30-days",
  "bundle-student-30-days",
  "bundle-trial-30-days",
  "bundle-creative-30-days",
  "bundle-pro-30-days",
  "bundle-boss-30-days",
  "test-bundle-tiny-gpt3-1-day",
  "test-bundle-tiny-gptokens-1-day"
] as const;

export type ProductCode = typeof productCodes[number];

type Term = {
  range: number;
  unit: "day";
};

const days30: Term = {
  range: 30,
  unit: "day"
};

const days1: Term = {
  range: 1,
  unit: "day"
};

export type Product = Subscription & {
  code: ProductCode;
  price: Money;
  details: {
    term: Term;
  };
};

export type PurchasedProduct = Product & {
  id: string;
  purchasedAt: At;
  usage: ProductUsage;
};

export function isPurchasedProduct(product: Subscription): product is PurchasedProduct {
  return "purchasedAt" in product;
}

export function freeSubscription(): Subscription {
  return {
    name: "Free Subscription",
    displayName: "Бесплатный",
    details: {
      type: "subscription",
      plan: defaultPlan
    }
  };
}

export function premiumSubscription(): Product {
  return {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    displayName: "Премиум на 30 дней",
    price: {
      currency: "RUB",
      amount: 290
    },
    details: {
      type: "subscription",
      plan: "premium",
      term: days30
    }
  };
}

export function unlimitedSubscription(): Product {
  return {
    code: "subscription-unlimited-30-days",
    name: "Unlimited Subscription - 30 Days",
    displayName: "Безлимит на 30 дней",
    price: {
      currency: "RUB",
      amount: 390
    },
    details: {
      type: "subscription",
      plan: "unlimited",
      term: days30
    }
  };
}

export function noviceBundle(): Product {
  return {
    code: "bundle-novice-30-days",
    name: "Novice Bundle - 30 Days",
    displayName: "Новичок на 30 дней",
    price: {
      currency: "RUB",
      amount: 49
    },
    details: {
      type: "bundle",
      plan: "novice",
      term: days30
    }
  };
}

export function studentBundle(): Product {
  return {
    code: "bundle-student-30-days",
    name: "Student Bundle - 30 Days",
    displayName: "Студент на 30 дней",
    price: {
      currency: "RUB",
      amount: 99
    },
    details: {
      type: "bundle",
      plan: "student",
      term: days30
    }
  };
}

export function trialBundle(): Product {
  return {
    code: "bundle-trial-30-days",
    name: "Trial Bundle - 30 Days",
    displayName: "Пробный на 30 дней",
    price: {
      currency: "RUB",
      amount: 99
    },
    details: {
      type: "bundle",
      plan: "trial",
      term: days30
    }
  };
}

export function creativeBundle(): Product {
  return {
    code: "bundle-creative-30-days",
    name: "Creative Bundle - 30 Days",
    displayName: "Творческий на 30 дней",
    price: {
      currency: "RUB",
      amount: 199
    },
    details: {
      type: "bundle",
      plan: "creative",
      term: days30
    }
  };
}

export function proBundle(): Product {
  return {
    code: "bundle-pro-30-days",
    name: "Pro Bundle - 30 Days",
    displayName: "Профи на 30 дней",
    price: {
      currency: "RUB",
      amount: 449
    },
    details: {
      type: "bundle",
      plan: "pro",
      term: days30
    }
  };
}

export function bossBundle(): Product {
  return {
    code: "bundle-boss-30-days",
    name: "Boss Bundle - 30 Days",
    displayName: "Босс на 30 дней",
    price: {
      currency: "RUB",
      amount: 999
    },
    details: {
      type: "bundle",
      plan: "boss",
      term: days30
    }
  };
}

/**
 * FOR TEST PURPOSES ONLY!
 */
export function testTinyGpt3Bundle(): Product {
  return {
    code: "test-bundle-tiny-gpt3-1-day",
    name: "Test Tiny Bundle GPT-3 - 1 Day",
    displayName: "Мелкий GPT-3 на 1 день",
    price: {
      currency: "RUB",
      amount: 9999
    },
    details: {
      type: "bundle",
      plan: "test-tinygpt3",
      term: days1
    }
  };
}

/**
 * FOR TEST PURPOSES ONLY!
 */
export function testTinyGptokenBundle(): Product {
  return {
    code: "test-bundle-tiny-gptokens-1-day",
    name: "Test Tiny Bundle Gptoken - 1 Day",
    displayName: "Мелкий Гптокен на 1 день",
    price: {
      currency: "RUB",
      amount: 9999
    },
    details: {
      type: "bundle",
      plan: "test-tinygptokens",
      term: days1
    }
  };
}
