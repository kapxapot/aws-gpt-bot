import { encodeText, sliceText } from "../../src/lib/telegram";

describe("sliceText", () => {
  test("should not slice the encoded characters", () => {
    const text = "абвгде";
    const encodedText = encodeText(text);
    const slicedText = sliceText(encodedText, 20);

    console.log(encodedText);

    expect(slicedText.length).toBe(3);
    expect(slicedText[0]).toBe("&#x430;&#x431;");
    expect(slicedText[1]).toBe("&#x432;&#x433;");
    expect(slicedText[2]).toBe("&#x434;&#x435;");
  });
});
