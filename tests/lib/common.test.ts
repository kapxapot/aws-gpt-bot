import { toText } from "../../src/lib/common";

describe('lib tests', () => {
  test('toText should concat strings into text', () => {
    expect(toText("one", "two")).toBe("one\n\ntwo");
  });
});
