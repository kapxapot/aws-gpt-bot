import { money } from "../money";
import { Product } from "../product";

export const gptProducts: Product[] = [
  {
    code: "bundle-novice-mini",
    name: "Novice Mini Bundle",
    shortName: "Новичок Мини",
    displayName: "Новичок Мини",
    icon: "👧",
    price: money(19),
    details: {
      type: "bundle",
      plan: "novice-mini"
    }
  },
  {
    code: "bundle-student-mini",
    name: "Student Mini Bundle",
    shortName: "Студент Мини",
    displayName: "Студент Мини",
    icon: "👨‍🎓",
    price: money(39),
    details: {
      type: "bundle",
      plan: "student-mini"
    }
  }
];
