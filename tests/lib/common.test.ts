import { isNumber, isNumeric, phoneToItu, toCleanArray, toFixedOrInt, toFixedOrIntStr } from "../../src/lib/common";
import { uglyArray } from "../testData";

describe("toCleanArray", () => {
  test("should clean strings", () => {
    const array = toCleanArray(uglyArray);

    expect(array).toHaveLength(2);
    expect(array[0]).toBe("one");
    expect(array[1]).toBe("two");
  });
});

describe("phoneToItu", () => {
  test("should return null for undefined", () => {
    expect(phoneToItu(undefined)).toBe(null);
  })

  test("should return null for no digits", () => {
    expect(phoneToItu(" aldfkgjfg  adsfg - adfg d,.,     ")).toBe(null);
  })

  test("should return only numbers", () => {
    expect(phoneToItu(" adfg89314958dkafljgalg 89 ")).toBe("8931495889");
  })
});

describe("isNumeric", () => {
  test("works for numeric strings", () => {
    expect(isNumeric("0123")).toBe(true)
  });

  test("doesn't work for non-numeric strings", () => {
    expect([
      isNumeric(""),
      isNumeric("123234a"),
      isNumber("abc")
    ]).toEqual([
      false,
      false,
      false
    ])
  });
});

describe("isNumber", () => {
  test("works for numbers", () => {
    expect(isNumber(123)).toBe(true)
  });

  test("doesn't work for non-numbers", () => {
    expect([
      isNumber({}),
      isNumber(null),
      isNumber("abc")
    ]).toEqual([
      false,
      false,
      false
    ])
  });
});

describe("toFixedOrIntStr", () => {
  const dataSet = [
    { input: 5, digits: undefined, output: "5" },
    { input: 10.1, digits: undefined, output: "10" },
    { input: 10.123, digits: undefined, output: "10" },
    { input: 10.123, digits: 1, output: "10.1" },
    { input: 10.156, digits: 1, output: "10.2" },
    { input: 9.996, digits: undefined, output: "10" },
    { input: 9.996, digits: 1, output: "10" },
    { input: 10.019, digits: 1, output: "10" },
  ];

  it.each(dataSet)(
    "works correctly",
    ({ input, digits, output }) =>
      expect(toFixedOrIntStr(input, digits))
        .toEqual(output)
  );
});

describe("toFixedOrInt", () => {
  const dataSet = [
    { input: 5, digits: undefined, output: 5 },
    { input: 10.1, digits: undefined, output: 10 },
    { input: 10.123, digits: undefined, output: 10 },
    { input: 10.123, digits: 1, output: 10.1 },
    { input: 10.156, digits: 1, output: 10.2 },
    { input: 9.996, digits: undefined, output: 10 },
    { input: 9.996, digits: 1, output: 10 },
    { input: 10.019, digits: 1, output: 10 },
    { input: 0.08600000000000001, digits: 3, output: 0.086 }
  ];

  it.each(dataSet)(
    "works correctly",
    ({ input, digits, output }) =>
      expect(toFixedOrInt(input, digits))
        .toEqual(output)
  );
});
