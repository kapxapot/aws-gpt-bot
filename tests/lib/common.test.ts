import { toSanitizedArray, toText } from "../../src/lib/common";

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
