import { isNumber, isNumeric, phoneToItu, toCleanArray, toFixedOrIntStr } from "../../src/lib/common";
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

describe("toFixedOrInt", () => {
  test("works correctly", () => {
    expect([
      toFixedOrIntStr(5),
      toFixedOrIntStr(10.1),
      toFixedOrIntStr(10.123),
      toFixedOrIntStr(10.123, 1),
      toFixedOrIntStr(10.156, 1),
      toFixedOrIntStr(9.996),
      toFixedOrIntStr(9.996, 1),
      toFixedOrIntStr(10.019, 1),
    ]).toEqual([
      "5",
      "10",
      "10",
      "10.1",
      "10.2",
      "10",
      "10",
      "10"
    ])
  });
});
