export const cases = [
  /** Именительный */
  "Nominative",
  /** Родительный */
  "Genitive",
  /** Дательный */
  "Dative",
  /** Винительный */
  "Accusative",
  /** Творительный */
  "Instrumental",
  /** Предложный */
  "Prepositional"
] as const;

export type GrammarCase = typeof cases[number];

export type GrammarNumber = "Singular" | "Plural";

type GrammarGender = "Masculine" | "Feminine" | "Neutral" | "Plural";

export const templateWords = [
  "картинка",
  "выпуск",
  "тариф",
  "день",
  "пользователь",
  "минута",
  "копия",
  "слово"
] as const;

export type TemplateWord = typeof templateWords[number];

export const derivedWords = [
  "пакет",
  "секунда",
  "час"
] as const;

export type DerivedWord = typeof derivedWords[number];

export type KnownWord = TemplateWord | DerivedWord;

export type CaseForms = Record<GrammarNumber, string[]>;

export type CaseData = {
  base: string,
  gender: GrammarGender
};

export type DerivedCaseData = CaseData & {
  index: TemplateWord;
};

export const caseTemplates: Record<TemplateWord, CaseForms> = {
  // [картин]ка
  "картинка": {
    "Singular": ["%ка", "%ки", "%ке", "%ку", "%кой", "%ке"],
    "Plural": ["%ки", "%ок", "%кам", "%ки", "%ками", "%ках"]
  },
  // [выпуск]
  "выпуск": {
    "Singular": ["%", "%а", "%у", "%", "%ом", "%е"],
    "Plural": ["%и", "%ов", "%ам", "%и", "%ами", "%ах"]
  },
  // [тариф], [пакет]
  "тариф": {
    "Singular": ["%", "%а", "%у", "%", "%ом", "%е"],
    "Plural": ["%ы", "%ов", "%ам", "%ы", "%ами", "%ах"]
  },
  // [д]ень
  "день": {
    "Singular": ["%ень", "%ня", "%ню", "%ень", "%нём", "%не"],
    "Plural": ["%ни", "%ней", "%ням", "%ни", "%нями", "%нях"]
  },
  // [пользовател]ь
  "пользователь": {
    "Singular": ["%ь", "%я", "%ю", "%я", "%ем", "%е"],
    "Plural": ["%и", "%ей", "%ям", "%ей", "%ями", "%ях"]
  },
  // [минут]а, [секунд]а
  "минута": {
    "Singular": ["%а", "%ы", "%е", "%у", "%ой", "%е"],
    "Plural": ["%ы", "%", "%ам", "%ы", "%ами", "%ах"]
  },
  // [копи]я
  "копия": {
    "Singular": ["%я", "%и", "%и", "%ю", "%ей", "%и"],
    "Plural": ["%и", "%й", "%ям", "%и", "%ями", "%ях"]
  },
  // [слов]о
  "слово": {
    "Singular": ["%о", "%а", "%у", "%о", "%ом", "%е"],
    "Plural": ["%а", "%", "%ам", "%а", "%ами", "%ах"]
  }
};

export const genuineCaseData: Record<TemplateWord, CaseData> = {
  "картинка": { base: "картин", gender: "Feminine" },
  "выпуск": { base: "выпуск", gender: "Masculine" },
  "тариф": { base: "тариф", gender: "Masculine" },
  "день": { base: "д", gender: "Masculine" },
  "пользователь": { base: "пользовател", gender: "Masculine" },
  "минута": { base: "минут", gender: "Feminine" },
  "копия": { base: "копи", gender: "Feminine" },
  "слово": { base: "слов", gender: "Neutral" }
};

export const derivedCaseData: Record<DerivedWord, DerivedCaseData> = {
  "пакет": {
    base: "пакет",
    index: "тариф",
    gender: "Masculine"
  },
  "секунда": {
    base: "секунд",
    index: "минута",
    gender: "Feminine"
  },
  "час": {
    base: "час",
    index: "тариф",
    gender: "Masculine"
  }
};
