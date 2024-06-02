import { andJoin, capitalize, commatize, orJoin, compactText, text } from "../../src/lib/text";
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
