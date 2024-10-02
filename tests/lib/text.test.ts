import { capitalize, commatize, compactText, text } from "../../src/lib/text";
import { uglyArray } from "../testData";

describe("text", () => {
  test("should concat strings into text", () => {
    expect(text("one", "two")).toBe("one\n\ntwo");
  });
});

describe("compactText", () => {
  test("should concat strings into compact text", () => {
    expect(compactText("one", "two")).toBe("one\ntwo");
  });
});

describe("commatize", () => {
  test("should sanitize and commatize strings", () => {
    expect(commatize(uglyArray))
      .toBe("one, two");
  });
});

describe("capitalize", () => {
  test("should capitalize strings", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize("a")).toBe("A");
    expect(capitalize("ab")).toBe("Ab");
  });
});
