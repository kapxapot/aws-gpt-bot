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
    price: money(99),
    details: {
      type: "bundle",
      plan: "trial"
    }
  },
  {
    code: "bundle-creative",
    name: "Creative",
    icon: "👩‍🎨",
    price: money(199),
    details: {
      type: "bundle",
      plan: "creative"
    }
  },
  {
    code: "bundle-pro",
    name: "Pro",
    icon: "😎",
    price: money(449),
    details: {
      type: "bundle",
      plan: "pro"
    }
  },
  {
    code: "bundle-boss",
    name: "Boss",
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
    name: "[Test] Tiny Gptoken",
    icon: "🛠",
    price: overprice, // to prevent buying but to allow test buying
    details: {
      type: "bundle",
      plan: "test-tinygptokens"
    }
  }
];
