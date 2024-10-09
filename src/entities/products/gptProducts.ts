import { money } from "../money";
import { Product } from "../product";

export const gptProducts: Product[] = [
  {
    code: "bundle-novice-mini",
    name: "Novice Mini",
    icon: "👧",
    prices: [
      money(19),
      money(15, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "novice-mini"
    }
  },
  {
    code: "bundle-student-mini",
    name: "Student Mini",
    icon: "👨‍🎓",
    prices: [
      money(39),
      money(31, "XTR")
    ],
    details: {
      type: "bundle",
      plan: "student-mini"
    }
  }
];
