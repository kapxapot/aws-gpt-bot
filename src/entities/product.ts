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
  displayNames: PartialRecord<GrammarCase, string>;
  details: {
    type: ProductType;
    plan: Plan;
  };
};

export const productCodes = [
  "subscription-premium-30-days",
  "subscription-unlimited-30-days",
  "bundle-starter-30-days",
  "bundle-creative-30-days",
  "bundle-pro-30-days",
  "test-bundle-tiny-gpt3-1-day",
  "test-bundle-tiny-gptokens-1-day"
] as const;

export type ProductCode = typeof productCodes[number];

export type Product = Subscription & {
  code: ProductCode;
  price: Money;
  details: {
    term: {
      range: number;
      unit: "day";
    };
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
    displayNames: {
      "Nominative": "Бесплатный"
    },
    details: {
      type: "subscription",
      plan: defaultPlan
    }
  };
}

export function monthlyPremiumSubscription(): Product {
  return {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    displayNames: {
      "Nominative": "Премиум на 30 дней",
      "Genitive": "Премиума на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 290
    },
    details: {
      type: "subscription",
      plan: "premium",
      term: {
        range: 30,
        unit: "day"
      }
    }
  };
}

export function monthlyUnlimitedSubscription(): Product {
  return {
    code: "subscription-unlimited-30-days",
    name: "Unlimited Subscription - 30 Days",
    displayNames: {
      "Nominative": "Безлимит на 30 дней",
      "Genitive": "Безлимита на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 390
    },
    details: {
      type: "subscription",
      plan: "unlimited",
      term: {
        range: 30,
        unit: "day"
      }
    }
  };
}

export function monthlyStarterBundle(): Product {
  return {
    code: "bundle-starter-30-days",
    name: "Starter Bundle - 30 Days",
    displayNames: {
      "Nominative": "Начальный на 30 дней",
      "Genitive": "Начального на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 199
    },
    details: {
      type: "bundle",
      plan: "starter",
      term: {
        range: 30,
        unit: "day"
      }
    }
  };
}

export function monthlyCreativeBundle(): Product {
  return {
    code: "bundle-creative-30-days",
    name: "Creative Bundle - 30 Days",
    displayNames: {
      "Nominative": "Творческий на 30 дней",
      "Genitive": "Творческого на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 299
    },
    details: {
      type: "bundle",
      plan: "creative",
      term: {
        range: 30,
        unit: "day"
      }
    }
  };
}

export function monthlyProBundle(): Product {
  return {
    code: "bundle-pro-30-days",
    name: "Pro Bundle - 30 Days",
    displayNames: {
      "Nominative": "Профессиональный на 30 дней",
      "Genitive": "Профессионального на 30 дней"
    },
    price: {
      currency: "RUB",
      amount: 749
    },
    details: {
      type: "bundle",
      plan: "pro",
      term: {
        range: 30,
        unit: "day"
      }
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
    displayNames: {},
    price: {
      currency: "RUB",
      amount: 9999
    },
    details: {
      type: "bundle",
      plan: "test-tinygpt3",
      term: {
        range: 1,
        unit: "day"
      }
    }
  };
}

/**
 * FOR TEST PURPOSES ONLY!
 */
export function testTinyGptokenBundle(): Product {
  return {
    code: "test-bundle-tiny-gptokens-1-day",
    name: "Test Tiny Bundle GPToken - 1 Day",
    displayNames: {},
    price: {
      currency: "RUB",
      amount: 9999
    },
    details: {
      type: "bundle",
      plan: "test-tinygptokens",
      term: {
        range: 1,
        unit: "day"
      }
    }
  };
}
