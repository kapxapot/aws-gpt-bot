import { money } from "../money";
import { Product } from "../product";

export const gptProducts: Product[] = [
  {
    code: "bundle-novice-mini",
    name: "Novice Mini",
    icon: "👧",
    price: money(19),
    details: {
      type: "bundle",
      plan: "novice-mini"
    }
  },
  {
    code: "bundle-student-mini",
    name: "Student Mini",
    icon: "👨‍🎓",
    price: money(39),
    details: {
      type: "bundle",
      plan: "student-mini"
    }
  }
];
