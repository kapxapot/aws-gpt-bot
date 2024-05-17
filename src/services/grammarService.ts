import { GrammarCase, GrammarNumber, KnownWord, TemplateWord, caseTemplates, cases, derivedCaseData, genuineCaseData, templateWords } from "../entities/grammar";

type GroupSetting = {
  case: GrammarCase,
  number: GrammarNumber
};

const groupSettings: Record<GrammarCase, GroupSetting> = {
  "Nominative": { case: "Genitive", number: "Singular" },
  "Genitive": { case: "Genitive", number: "Plural" },
  "Dative": { case: "Dative", number: "Plural" },
  "Accusative": { case: "Genitive", number: "Singular" },
  "Instrumental": { case: "Instrumental", number: "Plural" },
  "Prepositional": { case: "Prepositional", number: "Plural" }
};

/**
 * Returns noun form that corresponds the provided natural number.
 */
export function getCaseForNumber(word: KnownWord, num: number, targetCase?: GrammarCase): string {
  if (num < 0) {
    throw Error("Number must be non-negative.");
  }

  // group 3
  // case = "Genitive";
  // caseNumber = "Plural";
  let group = 3;

  // only two last digits define the noun form
  num = num % 100;

  if (num < 5 || num > 20) {
    switch (num % 10) {
      // group 1
      case 1:
        // case = "Nominative";
        // caseNumber = "Singular";
        group = 1;
        break;

      // group 2
      case 2:
      case 3:
      case 4:
        // case = "Genitive";
        // caseNumber = "Singular";
        group = 2;
        break;
    }
  }

  // for fractions - group 2
  if (num !== Math.floor(num)) {
    group = 2;
  }

  const setting = getCaseByNumberGroupSetting(targetCase ?? "Nominative", group);

  return getCase(word, setting.case, setting.number);
}

export function formatWordNumber(word: KnownWord, num: number, targetCase?: GrammarCase): string {
  return `${num} ${getCaseForNumber(word, num, targetCase)}`;
}

export function getCase(
  word: KnownWord,
  grammarCase?: GrammarCase,
  grammarNumber?: GrammarNumber
): string {
  const wordCaseData = isTemplateWord(word)
    ? genuineCaseData[word]
    : derivedCaseData[word];

  const templateWord = isTemplateWord(word)
    ? word
    : derivedCaseData[word].template;

  const caseForms = caseTemplates[templateWord];
  const caseIndex = cases.indexOf(grammarCase ?? "Nominative");
  const template = caseForms[grammarNumber ?? "Singular"][caseIndex];

  return template.replace("%", wordCaseData.base);
}

// именительный - кто что (у меня есть...)
// 1, 21 карта/стол (кто что, И, ед)
// 2, 3, 4 карты/стола (кого чего, Р, ед)
// 5..20 карт/столов (кого чего, Р, мн)

// родительный - кого чего (родитель...)
// 1, 21 карты/стола (кого чего, Р, ед)
// 2, 3, 4 карт/столов (кого чего, Р, мн)
// 5..20 карт/столов (кого чего, Р, мн)

// дательный - кому чему (дать...)
// 1, 21 карте/столу (кому чему, Д, ед)
// 2, 3, 4 картам/столам (кому чему, Д, мн)
// 5..20 картам/столам (кому чему, Д, мн)

// винительный - кого что (берете...)
// 1, 21 карту/стол (кого что, В, ед)
// 2, 3, 4 карты/стола (кого чего, Р, ед)
// 5..20 карт/столов (кого чего, Р, мн)

// творительный - кем чем (сотворен...)
// 1, 21 картой/столом (кем чем, Т, ед)
// 2, 3, 4 картами/столами (кем чем, Т, мн)
// 5..20 картами/столами (кем чем, Т, мн)

// предложный - о ком о чем (сказка...)
// 1, 21 о карте/о столе (о ком о чем, П, ед)
// 2, 3, 4 о картах/о столах (о ком о чем, П, мн)
// 5..20 о картах/о столах (о ком о чем, П, мн)

/**
 * @param group 1..3
 */
function getCaseByNumberGroupSetting(grammarCase: GrammarCase, group: number): GroupSetting {
  const setting = groupSettings[grammarCase];

  const groups: GroupSetting[] = [
    { case: grammarCase, number: "Singular" },
    setting,
    { case: setting.case, number: "Plural" }
  ];

  return groups[group - 1];
}

function isTemplateWord(word: KnownWord): word is TemplateWord {
  return templateWords.indexOf(word as string as TemplateWord) !== -1;
}
