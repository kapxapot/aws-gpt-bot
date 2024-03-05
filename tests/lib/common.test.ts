import { phoneToItu, toSanitizedArray, toText } from "../../src/lib/common";

describe("toText", () => {
  test("should concat strings into text", () => {
    expect(toText("one", "two")).toBe("one\n\ntwo");
  });
});

describe("toSanitizedArray", () => {
  test("should sanitize strings", () => {
    const array = toSanitizedArray([
      "",
      "    ",
      "   one  ",
      "    two   "
    ]);

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
