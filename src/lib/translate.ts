import { GrammarCase, KnownWord } from "../entities/grammar";
import { Interval } from "../entities/interval";
import { User } from "../entities/user";
import { formatWordNumber } from "../services/grammarService";
import { getUserLanguage } from "../services/userService";
import i18n from "../translation/i18n";
import { StringLike } from "./common";
import { homogeneousJoin, sentence } from "./text";
import { AnyRecord } from "./types";

const enWords = [
  "bundle",
  "coupon",
  "day",
  "dollar",
  "euro",
  "gptoken",
  "image",
  "month",
  "product",
  "request",
  "ruble",
  "second",
  "subscription",
  "week"
] as const;

export type EnWord = Interval | typeof enWords[number];

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

export function tWordNumber(user: User, word: EnWord, num: number, targetCase?: GrammarCase) {
  const language = getUserLanguage(user);

  if (language === "ru") {
    const ruWord = getRuWord(word);

    if (ruWord) {
      return formatWordNumber(ruWord, num, targetCase);
    }
  }

  return formatEnWordNumber(word, num);
}

export const orJoin = (user: User, ...lines: StringLike[]) =>
  homogeneousJoin(lines, t(user, "orDelimiter"));

function formatEnWordNumber(word: EnWord, num: number) {
  const wordForm = (num === 1)
    ? word
    : plural(word);

  return sentence(String(num), wordForm);
}

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
