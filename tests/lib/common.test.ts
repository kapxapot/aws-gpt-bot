import { andJoin, capitalize, commatize, isNumber, isNumeric, orJoin, phoneToItu, toCleanArray, toCompactText, toText } from "../../src/lib/common";

const uglyArray = [
  "",
  "    ",
  "   one  ",
  "    two   "
];

describe("toText", () => {
  test("should concat strings into text", () => {
    expect(toText("one", "two")).toBe("one\n\ntwo");
  });
});

describe("toCompactText", () => {
  test("should concat strings into compact text", () => {
    expect(toCompactText("one", "two")).toBe("one\ntwo");
  });
});

describe("toCleanArray", () => {
  test("should clean strings", () => {
    const array = toCleanArray(uglyArray);

    expect(array).toHaveLength(2);
    expect(array[0]).toBe("one");
    expect(array[1]).toBe("two");
  });
});

describe("commatize", () => {
  test("should sanitize and commatize strings", () => {
    expect(commatize(uglyArray))
      .toBe("one, two");
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

describe("capitalize", () => {
  test("should capitalize strings", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize("a")).toBe("A");
    expect(capitalize("ab")).toBe("Ab");
  });
});

describe("andJoin", () => {
  test("should join string with `и`", () => {
    expect(andJoin()).toBe("");
    expect(andJoin("a")).toBe("a");
    expect(andJoin("a", "b")).toBe("a и b");
    expect(andJoin("a", "b", "c")).toBe("a, b и c");
  });
});

describe("orJoin", () => {
  test("should join string with `или`", () => {
    expect(orJoin()).toBe("");
    expect(orJoin("a")).toBe("a");
    expect(orJoin("a", "b")).toBe("a или b");
    expect(orJoin("a", "b", "c")).toBe("a, b или c");
  });
});
