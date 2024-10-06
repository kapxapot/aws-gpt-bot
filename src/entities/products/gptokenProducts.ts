import { money, overprice } from "../money";
import { Product } from "../product";
import { days } from "../term";

export const gptokenProducts: Product[] = [
  // non-purchasable
  {
    code: "bundle-promo-30-days",
    name: "Promo Bundle - 30 Days",
    shortName: "Промо",
    displayName: "Промо на 30 дней",
    icon: "🎫",
    details: {
      type: "bundle",
      plan: "promo",
      term: days(30)
    }
  },
  {
    code: "bundle-trial-30-days",
    name: "Trial Bundle - 30 Days",
    shortName: "Пробный",
    displayName: "Пробный на 30 дней",
    icon: "🧪",
    details: {
      type: "bundle",
      plan: "trial",
      term: days(30)
    }
  },
  // purchasable
  {
    code: "bundle-trial",
    name: "Trial Bundle",
    shortName: "Пробный",
    displayName: "Пробный",
    icon: "🧪",
    price: money(99),
    details: {
      type: "bundle",
      plan: "trial"
    }
  },
  {
    code: "bundle-creative",
    name: "Creative Bundle",
    shortName: "Творческий",
    displayName: "Творческий",
    icon: "👩‍🎨",
    price: money(199),
    details: {
      type: "bundle",
      plan: "creative"
    }
  },
  {
    code: "bundle-pro",
    name: "Pro Bundle",
    shortName: "Профи",
    displayName: "Профи",
    icon: "😎",
    price: money(449),
    details: {
      type: "bundle",
      plan: "pro"
    }
  },
  {
    code: "bundle-boss",
    name: "Boss Bundle",
    shortName: "Босс",
    displayName: "Босс",
    icon: "🤴",
    price: money(999),
    details: {
      type: "bundle",
      plan: "boss"
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gptokens",
    name: "Test Tiny Bundle Gptoken",
    shortName: "Мелкий Гптокен",
    displayName: "Мелкий Гптокен",
    icon: "🛠",
    price: overprice, // to prevent buying but to allow test buying
    details: {
      type: "bundle",
      plan: "test-tinygptokens"
    }
  }
];
