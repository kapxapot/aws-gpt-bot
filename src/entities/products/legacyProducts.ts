import { money, overprice } from "../money";
import { Product } from "../product";
import { days } from "../term";

/**
 * These are legacy ones and are not active anymore.
 */
export const legacyProducts: Product[] = [
  {
    code: "subscription-premium-30-days",
    name: "Premium Subscription - 30 Days",
    shortName: "Премиум",
    displayName: "Премиум на 30 дней",
    icon: "💔",
    price: money(290),
    details: {
      type: "subscription",
      plan: "premium",
      term: days(30)
    }
  },
  {
    code: "subscription-unlimited-30-days",
    name: "Unlimited Subscription - 30 Days",
    shortName: "Безлимит",
    displayName: "Безлимит на 30 дней",
    icon: "💔",
    price: money(390),
    details: {
      type: "subscription",
      plan: "unlimited",
      term: days(30)
    }
  },
  {
    code: "bundle-novice-30-days",
    name: "Novice Bundle - 30 Days",
    shortName: "Новичок",
    displayName: "Новичок на 30 дней",
    icon: "👧",
    price: money(49),
    details: {
      type: "bundle",
      plan: "novice",
      term: days(30)
    }
  },
  {
    code: "bundle-student-30-days",
    name: "Student Bundle - 30 Days",
    shortName: "Студент",
    displayName: "Студент на 30 дней",
    icon: "👨‍🎓",
    price: money(99),
    details: {
      type: "bundle",
      plan: "student",
      term: days(30)
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gpt3-1-day",
    name: "Test Tiny Bundle GPT-3 - 1 Day",
    shortName: "Мелкий GPT-3",
    displayName: "Мелкий GPT-3 на 1 день",
    icon: "🛠",
    price: overprice,
    details: {
      type: "bundle",
      plan: "test-tinygpt3",
      term: days(1)
    }
  },
  // discontinued timed - gpt
  {
    code: "bundle-novice-mini-30-days",
    name: "Novice Mini Bundle - 30 Days",
    shortName: "Новичок Мини",
    displayName: "Новичок Мини на 30 дней",
    icon: "👧",
    price: money(19),
    details: {
      type: "bundle",
      plan: "novice-mini",
      term: days(30)
    }
  },
  {
    code: "bundle-student-mini-30-days",
    name: "Student Mini Bundle - 30 Days",
    shortName: "Студент Мини",
    displayName: "Студент Мини на 30 дней",
    icon: "👨‍🎓",
    price: money(39),
    details: {
      type: "bundle",
      plan: "student-mini",
      term: days(30)
    }
  },
  // discontinued timed - gptokens
  {
    code: "bundle-creative-30-days",
    name: "Creative Bundle - 30 Days",
    shortName: "Творческий",
    displayName: "Творческий на 30 дней",
    icon: "👩‍🎨",
    price: money(199),
    details: {
      type: "bundle",
      plan: "creative",
      term: days(30)
    }
  },
  {
    code: "bundle-pro-30-days",
    name: "Pro Bundle - 30 Days",
    shortName: "Профи",
    displayName: "Профи на 30 дней",
    icon: "😎",
    price: money(449),
    details: {
      type: "bundle",
      plan: "pro",
      term: days(30)
    }
  },
  {
    code: "bundle-boss-30-days",
    name: "Boss Bundle - 30 Days",
    shortName: "Босс",
    displayName: "Босс на 30 дней",
    icon: "🤴",
    price: money(999),
    details: {
      type: "bundle",
      plan: "boss",
      term: days(30)
    }
  },
  // FOR TEST PURPOSES ONLY!
  {
    code: "test-bundle-tiny-gptokens-1-day",
    name: "Test Tiny Bundle Gptoken - 1 Day",
    shortName: "Мелкий Гптокен",
    displayName: "Мелкий Гптокен на 1 день",
    icon: "🛠",
    price: overprice,
    details: {
      type: "bundle",
      plan: "test-tinygptokens",
      term: days(1)
    }
  }
] as const;
