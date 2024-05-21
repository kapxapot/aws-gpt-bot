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

export const templateWords = [
  "выпуск",
  "день",
  "евро",
  "картинка",
  "копия",
  "месяц",
  "минута",
  "неделя",
  "пользователь",
  "рубль",
  "слово",
  "тариф",
] as const;

export const derivedWords = [
  "гптокен",
  "доллар",
  "запрос",
  "купон",
  "пакет",
  "продукт",
  "секунда",
  "час",
] as const;

export type GrammarCase = typeof cases[number];
export type GrammarNumber = "Singular" | "Plural";
type GrammarGender = "Masculine" | "Feminine" | "Neutral" | "Plural";

export type TemplateWord = typeof templateWords[number];
export type DerivedWord = typeof derivedWords[number];
export type KnownWord = TemplateWord | DerivedWord;
export type CaseForms = Record<GrammarNumber, string[]>;

export type CaseData = {
  base: string
};

export type GenuineCaseData = CaseData & {
  gender: GrammarGender
};

export type DerivedCaseData = CaseData & {
  template: TemplateWord;
};

export const caseTemplates: Record<TemplateWord, CaseForms> = {
  // [выпуск]
  "выпуск": {
    "Singular": ["%", "%а", "%у", "%", "%ом", "%е"],
    "Plural": ["%и", "%ов", "%ам", "%и", "%ами", "%ах"]
  },
  // [д]ень
  "день": {
    "Singular": ["%ень", "%ня", "%ню", "%ень", "%нём", "%не"],
    "Plural": ["%ни", "%ней", "%ням", "%ни", "%нями", "%нях"]
  },
  // [евро]
  "евро": {
    "Singular": ["%", "%", "%", "%", "%", "%"],
    "Plural": ["%", "%", "%", "%", "%", "%"]
  },
  // [картин]ка
  "картинка": {
    "Singular": ["%ка", "%ки", "%ке", "%ку", "%кой", "%ке"],
    "Plural": ["%ки", "%ок", "%кам", "%ки", "%ками", "%ках"]
  },
  // [копи]я
  "копия": {
    "Singular": ["%я", "%и", "%и", "%ю", "%ей", "%и"],
    "Plural": ["%и", "%й", "%ям", "%и", "%ями", "%ях"]
  },
  // [месяц]
  "месяц": {
    "Singular": ["%", "%а", "%у", "%", "%ем", "%е"],
    "Plural": ["%ы", "%ев", "%ам", "%ы", "%ами", "%ах"]
  }, 
  // [минут]а, [секунд]а
  "минута": {
    "Singular": ["%а", "%ы", "%е", "%у", "%ой", "%е"],
    "Plural": ["%ы", "%", "%ам", "%ы", "%ами", "%ах"]
  },
  // [недел]я
  "неделя": {
    "Singular": ["%я", "%и", "%е", "%ю", "%ей", "%е"],
    "Plural": ["%и", "%ь", "%ям", "%и", "%ями", "%ях"]
  },
  // [пользовател]ь
  "пользователь": {
    "Singular": ["%ь", "%я", "%ю", "%я", "%ем", "%е"],
    "Plural": ["%и", "%ей", "%ям", "%ей", "%ями", "%ях"]
  },
  // [рубл]ь
  "рубль": {
    "Singular": ["%ь", "%я", "%ю", "%я", "%ём", "%е"],
    "Plural": ["%и", "%ей", "%ям", "%и", "%ями", "%ях"]
  },
  // [слов]о
  "слово": {
    "Singular": ["%о", "%а", "%у", "%о", "%ом", "%е"],
    "Plural": ["%а", "%", "%ам", "%а", "%ами", "%ах"]
  },
  // [тариф], [пакет], [запрос], [гптокен], [купон], [доллар], [продукт]
  "тариф": {
    "Singular": ["%", "%а", "%у", "%", "%ом", "%е"],
    "Plural": ["%ы", "%ов", "%ам", "%ы", "%ами", "%ах"]
  },
};

export const genuineCaseData: Record<TemplateWord, GenuineCaseData> = {
  "выпуск": { base: "выпуск", gender: "Masculine" },
  "день": { base: "д", gender: "Masculine" },
  "евро": { base: "евро", gender: "Masculine" },
  "картинка": { base: "картин", gender: "Feminine" },
  "копия": { base: "копи", gender: "Feminine" },
  "месяц": { base: "месяц", gender: "Masculine" },
  "минута": { base: "минут", gender: "Feminine" },
  "неделя": { base: "недел", gender: "Feminine" },
  "пользователь": { base: "пользовател", gender: "Masculine" },
  "рубль": { base: "рубл", gender: "Masculine" },
  "слово": { base: "слов", gender: "Neutral" },
  "тариф": { base: "тариф", gender: "Masculine" },
};

export const derivedCaseData: Record<DerivedWord, DerivedCaseData> = {
  "гптокен": { base: "гптокен", template: "тариф" },
  "доллар": { base: "доллар", template: "тариф" },
  "запрос": { base: "запрос", template: "тариф" },
  "купон": { base: "купон", template: "тариф" },
  "пакет": { base: "пакет", template: "тариф" },
  "продукт": { base: "продукт", template: "тариф" },
  "секунда": { base: "секунд", template: "минута" },
  "час": { base: "час", template: "тариф" },
};
