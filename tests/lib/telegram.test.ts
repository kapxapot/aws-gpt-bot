import { encodeText, sliceText } from "../../src/lib/telegram";

describe("sliceText", () => {
  test("should not slice the encoded characters", () => {
    const text = "абвгде.";
    const encodedText = encodeText(text);
    const slicedText = sliceText(encodedText, 20);

    expect(slicedText.length).toBe(3);
    expect(slicedText[0]).toBe("&#x430;&#x431;");
    expect(slicedText[1]).toBe("&#x432;&#x433;");
    expect(slicedText[2]).toBe("&#x434;&#x435;.");
  });
});

describe("encodeText", () => {
  test("should encode html tags", () => {
    const text = "<p>I am a paragraph.</p>";
    const encodedText = encodeText(text);

    expect(encodedText).toBe("&#x3C;p&#x3E;I am a paragraph.&#x3C;/p&#x3E;");
  });
});
