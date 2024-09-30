import { KnownWord } from "../entities/grammar";
import { User } from "../entities/user";
import { formatWordNumber } from "../services/grammarService";
import { getUserLanguage } from "../services/userService";
import i18n from "../translation/i18n";
import { sentence } from "./text";
import { AnyRecord } from "./types";

export type EnWord =
  "second";

type EnWordMeta = {
  plural: string;
  ruWord: KnownWord;
};

const wordMeta: Record<EnWord, EnWordMeta> = {
  "second": {
    plural: "seconds",
    ruWord: "секунда"
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

export function tWordNumber(user: User, word: EnWord, num: number) {
  const language = getUserLanguage(user);

  if (language === "ru") {
    const ruWord = getRuWord(word);

    if (ruWord) {
      return formatWordNumber(ruWord, num);
    }
  }

  return formatEnWordNumber(word, num);
}

function formatEnWordNumber(word: EnWord, num: number) {
  const wordForm = num === 1
    ? word
    : wordMeta[word].plural;

  return sentence(String(num), wordForm);
}

const getRuWord = (word: EnWord) => wordMeta[word].ruWord;

function setLanguage(user: User) {
  const language = getUserLanguage(user);

  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}
