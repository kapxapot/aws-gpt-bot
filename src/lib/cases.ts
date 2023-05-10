type KnownWords = "секунда";

export function getCaseByNumber(word: KnownWords, num: number): string {
  switch (word) {
    case "секунда":
      num = num % 100;

      if (num < 5 || num > 20) {
        switch (num % 10) {
          case 1:
            return "секунду";

          case 2:
          case 3:
          case 4:
            return "секунды";
        }
      }

      return "секунд";
  }
}
