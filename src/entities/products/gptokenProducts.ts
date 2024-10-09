import { money, overprice } from "../money";
import { Product } from "../product";
import { days } from "../term";

export const gptokenProducts: Product[] = [
  // non-purchasable
  {
    code: "bundle-promo-30-days",
    name: "30-Day Promo",
    shortName: "Promo",
    icon: "🎫",
    details: {
      type: "bundle",
      plan: "promo",
      term: days(30)
    }
  },
  {
    code: "bundle-trial-30-days",
    name: "30-Day Trial",
    shortName: "Trial",
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
    name: "Trial",
    icon: "🧪",
    prices: [
      money(99),
      money(77, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "trial"
    }
  },
  {
    code: "bundle-creative",
    name: "Creative",
    icon: "👩‍🎨",
    prices: [
      money(199),
      money(154, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "creative"
    }
  },
  {
    code: "bundle-pro",
    name: "Pro",
    icon: "😎",
    prices: [
      money(449),
      money(349, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "pro"
    }
  },
  {
    code: "bundle-boss",
    name: "Boss",
    icon: "🤴",
    prices: [
      money(999),
      money(779, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "boss"
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gptokens",
    name: "[Test] Tiny Gptoken",
    icon: "🛠",
    prices: [
      overprice, // to prevent buying but to allow test buying
      money(1, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "test-tinygptokens"
    }
  }
];
