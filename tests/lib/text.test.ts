import { capitalize, commatize, compactText, text, squashTerminators, sentence } from "../../src/lib/text";
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

describe("squashTerminators", () => {
  test("should keep strings without terminators unchanged", () => {
    expect(squashTerminators("hello")).toBe("hello");
    expect(squashTerminators("hello world")).toBe("hello world");
  });

  test("should keep single period at the end", () => {
    expect(squashTerminators("hello.")).toBe("hello.");
  });

  test("should keep three periods (ellipsis) at the end", () => {
    expect(squashTerminators("hello...")).toBe("hello...");
  });

  test("should convert two periods to one", () => {
    expect(squashTerminators("hello..")).toBe("hello.");
  });

  test("should convert more than three periods to three", () => {
    expect(squashTerminators("hello....")).toBe("hello...");
    expect(squashTerminators("hello.....")).toBe("hello...");
    expect(squashTerminators("hello......")).toBe("hello...");
  });

  test("should handle multiple periods with text before", () => {
    expect(squashTerminators("hello world..")).toBe("hello world.");
    expect(squashTerminators("hello world.....")).toBe("hello world...");
  });
});

describe("sentence", () => {
  test("should join words with spaces", () => {
    expect(sentence("hello", "world")).toBe("hello world");
  });

  test("should join multiple words", () => {
    expect(sentence("hello", "beautiful", "world")).toBe("hello beautiful world");
  });

  test("should apply squashTerminators to result with proper terminator", () => {
    expect(sentence("hello", "world.")).toBe("hello world.");
    expect(sentence("hello", "world..")).toBe("hello world.");
    expect(sentence("hello", "world...")).toBe("hello world...");
    expect(sentence("hello", "world....")).toBe("hello world...");
  });

  test("should handle empty strings", () => {
    expect(sentence("hello", "", "world")).toBe("hello world");
    expect(sentence("", "hello", "")).toBe("hello");
  });

  test("should handle null and undefined", () => {
    expect(sentence("hello", null, "world")).toBe("hello world");
    expect(sentence("hello", undefined, "world")).toBe("hello world");
  });

  test("should handle whitespace in input", () => {
    expect(sentence("  hello  ", "  world  ")).toBe("hello world");
  });
});
