import { cipherNumber, decipherNumber, digitArrayToNumber, digitArrayToString, numberToDigitArray, stringToDigitArray } from "../../src/services/cipherService";

describe("numberToDigitArray", () => {
  test("should correctly convert number to digit array", () => {
    expect(
      numberToDigitArray(123456789)
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("stringToDigitArray", () => {
  test("should correctly convert string to digit array", () => {
    expect(
      stringToDigitArray("0123456789")
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("digitArrayToNumber", () => {
  test("should correctly convert digit array to number", () => {
    expect(
      digitArrayToNumber([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    ).toBe(123456789);
  });
});

describe("digitArrayToString", () => {
  test("should correctly convert digit array to string", () => {
    expect(
      digitArrayToString([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    ).toBe('0123456789');
  });
});

describe("cipherNumber", () => {
  test("should correctly cipher the number", () => {
    expect(
      cipherNumber(1234567890, "12345")
    ).toBe("2468079135");
  });
});

describe("decipherNumber", () => {
  test("should correctly decipher the number", () => {
    expect(
      decipherNumber("2468079135", "12345")
    ).toBe(1234567890);
  });
});
