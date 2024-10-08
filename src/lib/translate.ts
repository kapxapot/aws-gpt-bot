import { GrammarCase, GrammarNumber, KnownWord } from "../entities/grammar";
import { Interval } from "../entities/interval";
import { ProductType } from "../entities/product";
import { User } from "../entities/user";
import { getCase, getCaseForNumber } from "../services/grammarService";
import { getUserLanguage } from "../services/userService";
import i18n from "../translation/i18n";
import { StringLike } from "./common";
import { homogeneousJoin, sentence } from "./text";
import { AnyRecord } from "./types";

const enWords = [
  "coupon",
  "dollar",
  "euro",
  "gptoken",
  "image",
  "product",
  "request",
  "ruble",
  "second",
] as const;

export type EnWord = ProductType | Interval | typeof enWords[number];

type EnWordMeta = {
  plural?: string;
  ruWord: KnownWord;
};

const wordMeta: Record<EnWord, EnWordMeta> = {
  "bundle": {
    ruWord: "пакет"
  },
  "coupon": {
    ruWord: "купон"
  },
  "day": {
    ruWord: "день"
  },
  "dollar": {
    ruWord: "доллар"
  },
  "euro": {
    ruWord: "евро"
  },
  "gptoken": {
    ruWord: "гптокен"
  },
  "image": {
    ruWord: "картинка"
  },
  "month": {
    ruWord: "месяц"
  },
  "product": {
    ruWord: "продукт"
  },
  "request": {
    ruWord: "запрос"
  },
  "ruble": {
    ruWord: "рубль"
  },
  "second": {
    ruWord: "секунда"
  },
  "subscription": {
    ruWord: "тариф"
  },
  "week": {
    ruWord: "неделя"
  }
};

/**
 * Translates a text for no user.
 */
export const t0 = (text: string, values?: AnyRecord) => t(undefined, text, values);

/**
 * Translates a text for the user.
 */
export function t(user: User | undefined, text: string, values?: AnyRecord) {
  if (user) {
    setLanguage(user);
  }

  return i18n.t(text, values);
}

export const tWordNumber = (user: User, word: EnWord, num: number, targetCase?: GrammarCase) =>
  sentence(
    String(num),
    tCaseForNumber(user, word, num, targetCase)
  );

export function tCaseForNumber(user: User, word: EnWord, num: number, targetCase?: GrammarCase) {
  const language = getUserLanguage(user);

  if (language === "ru") {
    const ruWord = getRuWord(word);

    if (ruWord) {
      return getCaseForNumber(ruWord, num, targetCase);
    }
  }

  return enCaseForNumber(word, num);
}

export function tCase(
  user: User,
  word: EnWord,
  grammarCase?: GrammarCase,
  grammarNumber: GrammarNumber = "Singular"
) {
  const language = getUserLanguage(user);

  if (language === "ru") {
    const ruWord = getRuWord(word);

    if (ruWord) {
      return getCase(ruWord, grammarCase, grammarNumber);
    }
  }

  return grammarNumber === "Plural"
    ? plural(word)
    : word;
}

export const orJoin = (user: User, ...lines: StringLike[]) =>
   homogeneousJoin(lines, t(user, "orDelimiter"));

export const tQuote = (user: User, content: StringLike) =>
  content ? t(user, "quote", { content }) : null;

const enCaseForNumber = (word: EnWord, num: number) =>
  (num === 1) ? word : plural(word);

const getRuWord = (word: EnWord) => wordMeta[word].ruWord;

function setLanguage(user: User) {
  const language = getUserLanguage(user);

  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}

function plural(word: EnWord) {
  return wordMeta[word].plural ?? `${word}s`;
}
