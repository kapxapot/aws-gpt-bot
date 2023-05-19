import { toText } from "../../src/lib/common";

describe("toText", () => {
  test("should concat strings into text", () => {
    expect(toText("one", "two")).toBe("one\n\ntwo");
  });
});
