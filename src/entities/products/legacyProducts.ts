import { Product } from "../product";
import { days } from "../term";

/**
 * These are legacy ones and are not active anymore.
 */
export const legacyProducts: Product[] = [
  {
    code: "subscription-premium-30-days",
    name: "30-Day Premium",
    shortName: "Premium",
    icon: "💔",
    // price: money(290),
    details: {
      type: "subscription",
      plan: "premium",
      term: days(30)
    }
  },
  {
    code: "subscription-unlimited-30-days",
    name: "30-Day Unlimited",
    shortName: "Unlimited",
    icon: "💔",
    // price: money(390),
    details: {
      type: "subscription",
      plan: "unlimited",
      term: days(30)
    }
  },
  {
    code: "bundle-novice-30-days",
    name: "30-Day Novice",
    shortName: "Novice",
    icon: "👧",
    // price: money(49),
    details: {
      type: "bundle",
      plan: "novice",
      term: days(30)
    }
  },
  {
    code: "bundle-student-30-days",
    name: "30-Day Student",
    shortName: "Student",
    icon: "👨‍🎓",
    // price: money(99),
    details: {
      type: "bundle",
      plan: "student",
      term: days(30)
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gpt3-1-day",
    name: "[Test] 1-Day Tiny GPT-3",
    shortName: "[Test] Tiny GPT-3",
    icon: "🛠",
    // price: overprice,
    details: {
      type: "bundle",
      plan: "test-tinygpt3",
      term: days(1)
    }
  },
  // discontinued timed - gpt
  {
    code: "bundle-novice-mini-30-days",
    name: "30-Day Novice Mini",
    shortName: "Novice Mini",
    icon: "👧",
    // price: money(19),
    details: {
      type: "bundle",
      plan: "novice-mini",
      term: days(30)
    }
  },
  {
    code: "bundle-student-mini-30-days",
    name: "30-Day Student Mini",
    shortName: "Student Mini",
    icon: "👨‍🎓",
    // price: money(39),
    details: {
      type: "bundle",
      plan: "student-mini",
      term: days(30)
    }
  },
  // discontinued timed - gptokens
  {
    code: "bundle-creative-30-days",
    name: "30-Day Creative",
    shortName: "Creative",
    icon: "👩‍🎨",
    // price: money(199),
    details: {
      type: "bundle",
      plan: "creative",
      term: days(30)
    }
  },
  {
    code: "bundle-pro-30-days",
    name: "30-Day Pro",
    shortName: "Pro",
    icon: "😎",
    // price: money(449),
    details: {
      type: "bundle",
      plan: "pro",
      term: days(30)
    }
  },
  {
    code: "bundle-boss-30-days",
    name: "30-Day Boss",
    shortName: "Boss",
    icon: "🤴",
    // price: money(999),
    details: {
      type: "bundle",
      plan: "boss",
      term: days(30)
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gptokens-1-day",
    name: "[Test] 1-Day Tiny Gptoken",
    shortName: "[Test] Tiny Gptoken",
    icon: "🛠",
    // price: overprice,
    details: {
      type: "bundle",
      plan: "test-tinygptokens",
      term: days(1)
    }
  }
] as const;
